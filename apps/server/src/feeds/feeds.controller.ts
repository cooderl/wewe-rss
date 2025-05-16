import {
  Controller,
  DefaultValuePipe,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Query,
  Request,
  Response,
  Post,
  Body,
} from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { Response as Res, Request as Req } from 'express';
import { TrpcService } from '@server/trpc/trpc.service';
import { TrpcRouter } from '@server/trpc/trpc.router';
import { PrismaService } from '@server/prisma/prisma.service';

@Controller('feeds')
export class FeedsController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly feedsService: FeedsService,
    private readonly trpcService: TrpcService,
    private readonly trpcRouter: TrpcRouter,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('/')
  async getFeedList() {
    return this.feedsService.getFeedList();
  }

  @Get('/all.(json|rss|atom)')
  async getFeeds(
    @Request() req: Req,
    @Response() res: Res,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number = 30,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('mode') mode: string,
    @Query('title_include') title_include: string,
    @Query('title_exclude') title_exclude: string,
    @Query('text_only') text_only: boolean = false,
    @Query('date', new ParseIntPipe({ optional: true })) date?: number,
  ) {
    const path = req.path;
    const type = path.split('.').pop() || '';

    const { content, mimeType } = await this.feedsService.handleGenerateFeed({
      type,
      limit,
      page,
      mode,
      title_include,
      title_exclude,
      text_only,
      date,
    });

    res.setHeader('Content-Type', mimeType);
    res.send(content);
  }

  @Get('/:feed.(json|rss|atom)')
  async getFeed(
    @Request() req: Req,
    @Response() res: Res,
    @Param('feed') feed: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('mode') mode: string,
    @Query('update') update: boolean = false,
    @Query('title_include') title_include: string,
    @Query('title_exclude') title_exclude: string,
    @Query('text_only') text_only: boolean = false,
    @Query('date', new ParseIntPipe({ optional: true })) date?: number,
  ) {
    // 从路径中提取类型，而不是从 feed 参数中分割
    const path = req.path;
    const type = path.split('.').pop() || '';
    const id = feed; // feed 参数已经是没有扩展名的部分
    this.logger.log('getFeed: ', id, 'type: ', type);

    if (update) {
      this.feedsService.updateFeed(id);
    }

    const { content, mimeType } = await this.feedsService.handleGenerateFeed({
      id,
      type,
      limit,
      page,
      mode,
      title_include,
      title_exclude,
      text_only,
      date,
    });

    res.setHeader('Content-Type', mimeType);
    res.send(content);
  }

  

  @Post('/auto-add-wxs')
  async autoAddWxsArticle(@Body() body: { url: string }) {
    this.logger.log('自动添加微信公众号文章，URL:', body.url);
    
    try {
      // 1. 获取公众号信息
      const mpInfoResults = await this.trpcService.getMpInfo(body.url);
      if (!mpInfoResults || !mpInfoResults.length) {
        return { success: false, message: '获取公众号信息失败', step: 1 };
      }
      
      const mpInfo = mpInfoResults[0];
      if (!mpInfo || !mpInfo.id) {
        return { success: false, message: '获取公众号信息失败', step: 1 };
      }
      
      // 2. 添加订阅源
      // 直接使用 PrismaService 添加订阅源
      await this.prismaService.feed.upsert({
        where: { id: mpInfo.id },
        update: {
          mpName: mpInfo.name,
          mpCover: mpInfo.cover,
          mpIntro: mpInfo.intro,
          updateTime: mpInfo.updateTime,
          status: 1, // 启用状态
        },
        create: {
          id: mpInfo.id,
          mpName: mpInfo.name,
          mpCover: mpInfo.cover,
          mpIntro: mpInfo.intro,
          updateTime: mpInfo.updateTime,
          status: 1, // 启用状态
          syncTime: Math.floor(Date.now() / 1e3),
        },
      });
      
      // 3. 刷新文章列表
      await this.trpcService.refreshMpArticlesAndUpdateFeed(mpInfo.id);
      
      // 4. 获取文章列表和订阅源列表
      // 直接使用 PrismaService 查询数据
      const articles = await this.prismaService.article.findMany({
        orderBy: [{ publishTime: 'desc' }],
        take: 20,
      });
      
      const feeds = await this.prismaService.feed.findMany({
        orderBy: [{ createdAt: 'asc' }],
      });
      
      return {
        success: true,
        message: '成功添加微信公众号文章',
        mpInfo,
        articles,
        feeds,
      };
      
    } catch (error) {
      this.logger.error('自动添加微信公众号文章失败', error);
      return {
        success: false,
        message: `处理失败: ${error.message}`,
        error: error.response?.data || error.message,
      };
    }
  }
}
