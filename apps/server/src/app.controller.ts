import { Controller, Get, Redirect, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/robots.txt')
  forRobot(): string {
    return 'User-agent:  *\nDisallow:  /';
  }

  @Get('favicon.ico')
  @Redirect('https://r2-assets.111965.xyz/wewe-rss.png', 302)
  getFavicon() {}

  @Get('/dash*')
  @Render('index.hbs')
  dashRender() {
    const { originUrl: weweRssServerOriginUrl } =
      this.appService.getFeedConfig();
    return {
      weweRssServerOriginUrl,
    };
  }
}
