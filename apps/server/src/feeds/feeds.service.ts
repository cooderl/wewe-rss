import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { TrpcService } from '@server/trpc/trpc.service';
import { feedMimeTypeMap, feedTypes } from '@server/constants';
import { ConfigService } from '@nestjs/config';
import { Article, Feed as FeedInfo } from '@prisma/client';
import { ConfigurationType } from '@server/configuration';
import { Feed } from 'feed';
import got, { Got } from 'got';
import { load } from 'cheerio';
import { minify } from 'html-minifier';
import NodeCache from 'node-cache';
import pMap from '@cjs-exporter/p-map';

console.log('CRON_EXPRESSION: ', process.env.CRON_EXPRESSION);

const mpCache = new NodeCache({
  maxKeys: 1000,
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

    for (const feed of feeds) {
      this.logger.debug('feed', feed.id);
      await this.trpcService.refreshMpArticlesAndUpdateFeed(feed.id);
      // wait 30s for next feed
      await new Promise((resolve) => setTimeout(resolve, 30 * 1e3));
    }
  }

  async cleanHtml(source: string) {
    const $ = load(source, { decodeEntities: false });

    const dirtyHtml = $.html($('.rich_media_content'));

    const html = dirtyHtml
      .replace(/data-src=/g, 'src=')
      .replace(/visibility: hidden;/g, '');

    const content =
      '<style> .rich_media_content {overflow: hidden;color: #222;font-size: 17px;word-wrap: break-word;-webkit-hyphens: auto;-ms-hyphens: auto;hyphens: auto;text-align: justify;position: relative;z-index: 0;}.rich_media_content {font-size: 18px;}</style>' +
      html;

    const result = minify(content, {
      removeAttributeQuotes: true,
      collapseWhitespace: true,
    });

    return result;
  }

  async getHtmlByUrl(url: string) {
    const html = await this.request(url, { responseType: 'text' }).text();
    const result = await this.cleanHtml(html);

    return result;
  }

  async tryGetContent(id: string) {
    let content = mpCache.get(id) as string;
    if (content) {
      return content;
    }
    const url = `https://mp.weixin.qq.com/s/${id}`;
    content = await this.getHtmlByUrl(url).catch((e) => {
      this.logger.error('getHtmlByUrl error:', e);
      return '';
    });
    mpCache.set(id, content);
    return content;
  }

  async renderFeed({
    type,
    feedInfo,
    articles,
  }: {
    type: string;
    feedInfo: FeedInfo;
    articles: Article[];
  }) {
    const { originUrl, mode } =
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
    });

    feed.addExtension({
      name: 'generator',
      objects: `WeWe-RSS`,
    });

    const enableFullText = mode === 'fulltext';

    const mapper = async (item) => {
      const { title, id, publishTime, picUrl } = item;
      const link = `https://mp.weixin.qq.com/s/${id}`;

      const published = new Date(publishTime * 1e3);

      let description = '';
      if (enableFullText) {
        description = await this.tryGetContent(id);
      }

      feed.addItem({
        id,
        title,
        link: link,
        guid: link,
        description,
        date: published,
        image: picUrl,
      });
    };

    await pMap(articles, mapper, { concurrency: 2, stopOnError: false });

    return feed;
  }

  async handleGenerateFeed({
    id,
    type,
    limit,
  }: {
    id: string;
    type: string;
    limit: number;
  }) {
    const feedInfo = await this.prismaService.feed.findFirst({ where: { id } });

    if (!feedInfo) {
      throw new HttpException('不存在该feed！', HttpStatus.BAD_REQUEST);
    }

    if (!feedTypes.includes(type as any)) {
      type = 'atom';
    }

    const articles = await this.prismaService.article.findMany({
      where: { mpId: id },
      orderBy: { publishTime: 'desc' },
      take: limit,
    });

    this.logger.log('handleGenerateFeed articles: ' + articles.length);
    const feed = await this.renderFeed({ feedInfo, articles, type });

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
  async handleGenerateAllFeed({
    type,
    limit,
  }: {
    type: string;
    limit: number;
  }) {
    if (!feedTypes.includes(type as any)) {
      type = 'atom';
    }

    const articles = await this.prismaService.article.findMany({
      orderBy: { publishTime: 'desc' },
      take: limit,
    });

    const feedInfo: FeedInfo = {
      id: 'all',
      mpName: 'WeWe-RSS',
      mpIntro: 'WeWe-RSS',
      mpCover: 'https://r2-assets.111965.xyz/wewe-rss.png',
      status: 1,
      syncTime: 0,
      updateTime: Math.floor(Date.now() / 1e3),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const feed = await this.renderFeed({ feedInfo, articles, type });

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
}
