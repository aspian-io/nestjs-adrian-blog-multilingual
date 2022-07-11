import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor ( private readonly appService: AppService ) { }

  @Get()
  getHello (): string {
    return this.appService.getHello();
  }
}
