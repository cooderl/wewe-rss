import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { TrpcService } from '@server/trpc/trpc.service';
import { feedMimeTypeMap, feedTypes } from '@server/constants';
import { ConfigService } from '@nestjs/config';
import { Article, Feed as FeedInfo } from '@prisma/client';
import { ConfigurationType } from '@server/configuration';
import { Feed, Item } from 'feed';
import got, { Got } from 'got';
import { load } from 'cheerio';
import { minify } from 'html-minifier';
import { LRUCache } from 'lru-cache';
import pMap from '@cjs-exporter/p-map';

console.log('CRON_EXPRESSION: ', process.env.CRON_EXPRESSION);

const mpCache = new LRUCache<string, string>({
  max: 5000,
});

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(this.constructor.name);

  private request: Got;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly trpcService: TrpcService,
    private readonly configService: ConfigService,
  ) {
    this.request = got.extend({
      retry: {
        limit: 3,
        methods: ['GET'],
      },
      timeout: 8 * 1e3,
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'sec-ch-ua':
          '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
      },
      hooks: {
        beforeRetry: [
          async (options, error, retryCount) => {
            this.logger.warn(`retrying ${options.url}...`);
            return new Promise((resolve) =>
              setTimeout(resolve, 2e3 * (retryCount || 1)),
            );
          },
        ],
      },
    });
  }

  @Cron(process.env.CRON_EXPRESSION || '35 5,17 * * *', {
    name: 'updateFeeds',
    timeZone: 'Asia/Shanghai',
  })
  async handleUpdateFeedsCron() {
    this.logger.debug('Called handleUpdateFeedsCron');

    const feeds = await this.prismaService.feed.findMany({
      where: { status: 1 },
    });
    this.logger.debug('feeds length:' + feeds.length);

    const updateDelayTime =
      this.configService.get<ConfigurationType['feed']>(
        'feed',
      )!.updateDelayTime;

    for (const feed of feeds) {
      this.logger.debug('feed', feed.id);
      try {
        await this.trpcService.refreshMpArticlesAndUpdateFeed(feed.id);

        await new Promise((resolve) =>
          setTimeout(resolve, updateDelayTime * 1e3),
        );
      } catch (err) {
        this.logger.error('handleUpdateFeedsCron error', err);
      } finally {
        // wait 30s for next feed
        await new Promise((resolve) => setTimeout(resolve, 30 * 1e3));
      }
    }
  }

  async cleanHtml(source: string) {
    console.log('[cleanHtml] source 内容片段:', source.slice(0, 10000)); // 只打印前1000字符，避免日志过大
    const $ = load(source, { decodeEntities: false });
  
    // 选取 rich_media_content 节点
    const richMediaContent = $('.rich_media_content');
    console.log('[cleanHtml] rich_media_content 节点数量:', richMediaContent.length);
  
    const dirtyHtml = $.html(richMediaContent);
    console.log('[cleanHtml] dirtyHtml 长度:', dirtyHtml.length);
    // 可选：console.log('[cleanHtml] dirtyHtml 片段:', dirtyHtml.slice(0, 200));
  
    const html = dirtyHtml
      .replace(/data-src=/g, 'src=')
      .replace(/opacity: 0( !important)?;/g, '')
      .replace(/visibility: hidden;/g, '');
  
    const content =
      '<style> .rich_media_content {overflow: hidden;color: #222;font-size: 17px;word-wrap: break-word;-webkit-hyphens: auto;-ms-hyphens: auto;hyphens: auto;text-align: justify;position: relative;z-index: 0;}.rich_media_content {font-size: 18px;}</style>' +
      html;
  
    const result = minify(content, {
      removeAttributeQuotes: true,
      collapseWhitespace: true,
    });
  
    console.log('[cleanHtml] minify 后长度:', result.length);
  
    return result;
  }

  async getHtmlByUrl(url: string) {
    const html = await this.request(url, { responseType: 'text' }).text();
    console.log(`[getHtmlByUrl] 抓取到原始HTML长度: ${html.length}`);
    // 可选：保存原始HTML到文件
    // require('fs').writeFileSync('/tmp/raw.html', html);
  
    if (
      this.configService.get<ConfigurationType['feed']>('feed')!.enableCleanHtml
    ) {
      const result = await this.cleanHtml(html);
      console.log(`[getHtmlByUrl] cleanHtml后HTML长度: ${result.length}`);
      // 可选：保存clean后的HTML
      // require('fs').writeFileSync('/tmp/clean.html', result);
      return result;
    }
  
    return html;
  }

  async tryGetContent(id: string) {
    let content = mpCache.get(id);
    if (content) {
      return content;
    }
    const url = `https://mp.weixin.qq.com/s/${id}`;
    content = await this.getHtmlByUrl(url).catch((e) => {
      this.logger.error(`getHtmlByUrl(${url}) error: ${e.message}`);

      return '获取全文失败，请重试~';
    });
    mpCache.set(id, content);
    return content;
  }

  async renderFeed({
    type,
    feedInfo,
    articles,
    mode,
    text_only,
  }: {
    type: string;
    feedInfo: FeedInfo;
    articles: Article[];
    mode?: string;
    text_only?: boolean;
  }) {
    const { originUrl, mode: globalMode } =
      this.configService.get<ConfigurationType['feed']>('feed')!;

    const link = `${originUrl}/feeds/${feedInfo.id}.${type}`;

    const feed = new Feed({
      title: feedInfo.mpName,
      description: feedInfo.mpIntro,
      id: link,
      link: link,
      language: 'zh-cn', // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
      image: feedInfo.mpCover,
      favicon: feedInfo.mpCover,
      copyright: '',
      updated: new Date(feedInfo.updateTime * 1e3),
      generator: 'WeWe-RSS',
      author: { name: feedInfo.mpName },
    });

    feed.addExtension({
      name: 'generator',
      objects: `WeWe-RSS`,
    });

    const feeds = await this.prismaService.feed.findMany({
      select: { id: true, mpName: true },
    });

    /**mode 高于 globalMode。如果 mode 值存在，取 mode 值*/
    const enableFullText =
      typeof mode === 'string'
        ? mode === 'fulltext'
        : globalMode === 'fulltext';

    const showAuthor = feedInfo.id === 'all';

    const mapper = async (item) => {
      const { title, id, publishTime, picUrl, mpId } = item;
      const link = `https://mp.weixin.qq.com/s/${id}`;

      const mpName = feeds.find((item) => item.id === mpId)?.mpName || '-';
      const published = new Date(publishTime * 1e3);

      let content_html = '';
      let content_text = '';
      
      if (enableFullText) {
        content_html = await this.tryGetContent(id);
        
        // 如果启用了纯文本模式，将HTML转换为纯文本
        if (text_only && content_html) {
          const cheerio = require('cheerio');
          // 去除样式标签
          content_html = content_html.replace(/<style[\s\S]*?<\/style>/gi, '');
          
          const $ = cheerio.load(content_html);
          
          // 处理<br>标签为换行符
          $('br').replaceWith('\n');
          
          // 处理<p>标签为段落（添加双换行）
          $('p').each(function() {
            $(this).replaceWith($(this).text() + '\n\n');
          });
          
          // 获取纯文本内容
          content_text = $.text();
          
          // 去除多余的空白字符
          content_text = content_text.replace(/\s+/g, ' ').trim();
          
          // 恢复换行符
          content_text = content_text.replace(/ \n /g, '\n');
        }
      }

      // 创建基本的feed项
      const feedItem = {
        id,
        title,
        link: link,
        guid: link,
        date: published,
        image: picUrl,
        author: showAuthor ? [{ name: mpName }] : undefined,
      };
      
      // 根据 text_only 参数决定使用HTML内容还是纯文本内容
      if (text_only) {
        // 如果启用了纯文本模式，使用纯文本内容
        if (content_text) {
          feedItem['content'] = content_text;
        }
      } else {
        // 如果没有启用纯文本模式，使用HTML内容
        if (content_html) {
          feedItem['content'] = content_html;
        }
      }
      
      feed.addItem(feedItem);
    };

    await pMap(articles, mapper, { concurrency: 2, stopOnError: false });

    return feed;
  }

  async handleGenerateFeed({
    id,
    type,
    limit,
    page,
    mode,
    title_include,
    title_exclude,
    text_only,
    date,
  }: {
    id?: string;
    type: string;
    limit: number;
    page: number;
    mode?: string;
    title_include?: string;
    title_exclude?: string;
    text_only?: boolean;
    date?: number;
  }) {
    if (!feedTypes.includes(type as any)) {
      type = 'atom';
    }

    let articles: Article[];
    let feedInfo: FeedInfo;
    let dateFilter = {};
    if (date && date > 0) {
      const now = Math.floor(Date.now() / 1000);
      const daysAgo = now - date * 24 * 60 * 60; 
      dateFilter = {
        publishTime: {
          gte: daysAgo
        }
      };
    }
    
    if (id) {
      feedInfo = (await this.prismaService.feed.findFirst({
        where: { id },
      }))!;

      if (!feedInfo) {
        throw new HttpException('不存在该feed！', HttpStatus.BAD_REQUEST);
      }

      articles = await this.prismaService.article.findMany({
        where: { 
          mpId: id,
          ...dateFilter
        },
        orderBy: { publishTime: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      });
    } else {
      articles = await this.prismaService.article.findMany({
        where: dateFilter,
        orderBy: { publishTime: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      });

      const { originUrl } =
        this.configService.get<ConfigurationType['feed']>('feed')!;
      feedInfo = {
        id: 'all',
        mpName: 'WeWe-RSS All',
        mpIntro: 'WeWe-RSS 全部文章',
        mpCover: originUrl
          ? `${originUrl}/favicon.ico`
          : 'https://r2-assets.111965.xyz/wewe-rss.png',
        status: 1,
        syncTime: 0,
        updateTime: Math.floor(Date.now() / 1e3),
        hasHistory: -1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    this.logger.log('handleGenerateFeed articles: ' + articles.length);
    const feed = await this.renderFeed({ feedInfo, articles, type, mode, text_only });

    if (title_include) {
      const includes = title_include.split('|');
      feed.items = feed.items.filter((i: Item) =>
        includes.some((k) => i.title.includes(k)),
      );
    }
    if (title_exclude) {
      const excludes = title_exclude.split('|');
      feed.items = feed.items.filter(
        (i: Item) => !excludes.some((k) => i.title.includes(k)),
      );
    }

    switch (type) {
      case 'rss':
        return { content: feed.rss2(), mimeType: feedMimeTypeMap[type] };
      case 'json':
        return { content: feed.json1(), mimeType: feedMimeTypeMap[type] };
      case 'atom':
      default:
        return { content: feed.atom1(), mimeType: feedMimeTypeMap[type] };
    }
  }

  async getFeedList() {
    const data = await this.prismaService.feed.findMany();

    return data.map((item) => {
      return {
        id: item.id,
        name: item.mpName,
        intro: item.mpIntro,
        cover: item.mpCover,
        syncTime: item.syncTime,
        updateTime: item.updateTime,
      };
    });
  }

  async updateFeed(id: string) {
    try {
      await this.trpcService.refreshMpArticlesAndUpdateFeed(id);
    } catch (err) {
      this.logger.error('updateFeed error', err);
    } finally {
      // wait 30s for next feed
      await new Promise((resolve) => setTimeout(resolve, 30 * 1e3));
    }
  }
}
