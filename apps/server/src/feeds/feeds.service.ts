import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { TrpcService } from '@server/trpc/trpc.service';
import { feedMimeTypeMap, feedTypes } from '@server/constants';
import { ConfigService } from '@nestjs/config';
import { Article, Feed as FeedInfo } from '@prisma/client';
import { ConfigurationType } from '@server/configuration';
import { Feed } from 'feed';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly trpcService: TrpcService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('35 5,17 * * *', {
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

  renderFeed({
    type,
    feedInfo,
    articles,
  }: {
    type: string;
    feedInfo: FeedInfo;
    articles: Article[];
  }) {
    const { originUrl } =
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


    // TODO add fetch fulltext

    for (const item of articles) {
      const { title, id, publishTime, picUrl } = item;
      const link = `https://mp.weixin.qq.com/s/${id}`;
      const published = new Date(publishTime * 1e3);
      feed.addItem({
        id,
        title,
        link: link,
        guid: link,
        description: '',
        date: published,
        image: picUrl,
      });
    }

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
      where: { id },
      orderBy: { publishTime: 'desc' },
      take: limit,
    });

    const feed = this.renderFeed({ feedInfo, articles, type });

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
    const feed = this.renderFeed({ feedInfo, articles, type });

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
