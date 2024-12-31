import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  getHello(): string {
    const { host, isProd, port, baseUrl } = this.configService.get('server');
    return `
    <div style="display:flex;justify-content: center;height: 100%;align-items: center;font-size: 30px;">
    <div>>> <a href="${baseUrl}dash">WeWe RSS</a> <<</div>
    </div>`;
  }
}
