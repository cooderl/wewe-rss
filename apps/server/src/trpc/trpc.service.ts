import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '@server/configuration';
import { statusMap } from '@server/constants';
import { PrismaService } from '@server/prisma/prisma.service';
import { TRPCError, initTRPC } from '@trpc/server';
import Axios, { AxiosInstance } from 'axios';

@Injectable()
export class TrpcService {
  trpc = initTRPC.create();
  publicProcedure = this.trpc.procedure;
  protectedProcedure = this.trpc.procedure.use(({ ctx, next }) => {
    const errorMsg = (ctx as any).errorMsg;
    if (errorMsg) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: errorMsg });
    }
    return next({ ctx });
  });
  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;
  request: AxiosInstance;

  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const { url } =
      this.configService.get<ConfigurationType['platform']>('platform')!;
    this.request = Axios.create({ baseURL: url, timeout: 15 * 1e3 });

    this.request.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        this.logger.log('error: ', error);
        const errMsg = error.response?.data?.message || '';

        if (errMsg.includes('WeReadError401')) {
          // 账号失效
          await this.prismaService.account.update({
            where: { id: (error.config.headers as any).xid },
            data: { status: statusMap.INVALID },
          });
        } else if (errMsg.includes('WeReadError429')) {
          //TODO 处理请求频繁
        }

        return Promise.reject(error);
      },
    );
  }

  async getMpArticles(mpId: string) {
    const account = await this.prismaService.account.findFirst({
      where: { status: statusMap.ENABLE },
    });

    if (!account) {
      throw new Error('暂无可用读书账号!');
    }

    return this.request
      .get<
        {
          id: string;
          title: string;
          picUrl: string;
          publishTime: number;
        }[]
      >(`/api/platform/mps/${mpId}/articles`, {
        headers: {
          xid: account.id,
          Authorization: `Bearer ${account.token}`,
        },
      })
      .then((res) => res.data);
  }

  async refreshMpArticlesAndUpdateFeed(mpId: string) {
    const articles = await this.getMpArticles(mpId);

    const results = await this.prismaService.article.createMany({
      data: articles.map(({ id, picUrl, publishTime, title }) => ({
        id,
        mpId,
        picUrl,
        publishTime,
        title,
      })),
      skipDuplicates: true,
    });

    this.logger.debug('refreshMpArticlesAndUpdateFeed results: ', results);

    await this.prismaService.feed.update({
      where: { id: mpId },
      data: {
        syncTime: Math.floor(Date.now() / 1e3),
      },
    });
  }

  async getMpInfo(url: string) {
    const account = await this.prismaService.account.findFirst({
      where: { status: statusMap.ENABLE },
    });
    if (!account) {
      throw new Error('暂无可用读书账号!');
    }

    return this.request
      .post<
        {
          id: string;
          cover: string;
          name: string;
          intro: string;
          updateTime: number;
        }[]
      >(
        `/api/platform/wxs2mp`,
        { url },
        {
          headers: {
            xid: account.id,
            Authorization: `Bearer ${account.token}`,
          },
        },
      )
      .then((res) => res.data);
  }

  async createLoginUrl() {
    return this.request
      .post<{
        uuid: string;
        scanUrl: string;
      }>(`/api/login/platform`)
      .then((res) => res.data);
  }

  async getLoginResult(id: string) {
    return this.request
      .get<{
        message: 'waiting' | 'success';
        vid?: number;
        token?: string;
        username?: string;
      }>(`/api/login/platform/${id}`)
      .then((res) => res.data);
  }
}
