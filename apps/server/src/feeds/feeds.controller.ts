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
} from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { Response as Res, Request as Req } from 'express';

@Controller('feeds')
export class FeedsController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly feedsService: FeedsService) {}

  @Get('/all.(json|rss|atom)')
  async getFeeds(
    @Request() req: Req,
    @Response() res: Res,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number = 30,
  ) {
    const path = req.path;
    const type = path.split('.').pop() || '';
    const { content, mimeType } = await this.feedsService.handleGenerateAllFeed(
      {
        type,
        limit,
      },
    );

    res.setHeader('Content-Type', mimeType);
    res.send(content);
  }

  @Get('/:feed')
  async getFeed(
    @Response() res: Res,
    @Param('feed') feed: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    const [id, type] = feed.split('.');
    const { content, mimeType } = await this.feedsService.handleGenerateFeed({
      id,
      type,
      limit,
    });

    res.setHeader('Content-Type', mimeType);
    res.send(content);
  }
}
