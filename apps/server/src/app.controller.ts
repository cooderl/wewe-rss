import { Controller, Get, Response, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from './configuration';
import { Response as Res } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/robots.txt')
  forRobot(): string {
    return 'User-agent:  *\nDisallow:  /';
  }

  @Get('favicon.ico')
  getFavicon(
    @Response() res: Res,
  ) {
    const imgContent = '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'
    const imgBuffer = Buffer.from(imgContent, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(imgBuffer);
  }

  @Get('/dash*')
  @Render('index.hbs')
  dashRender() {
    const { originUrl: weweRssServerOriginUrl } =
      this.configService.get<ConfigurationType['feed']>('feed')!;
    const { code } = this.configService.get<ConfigurationType['auth']>('auth')!;

    return {
      weweRssServerOriginUrl,
      enabledAuthCode: !!code,
      iconUrl: weweRssServerOriginUrl
        ? `${weweRssServerOriginUrl}/favicon.ico`
        : 'https://r2-assets.111965.xyz/wewe-rss.png'
    };
  }
}
