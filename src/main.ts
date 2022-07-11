import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { i18nValidationErrorFactory, I18nValidationExceptionFilter } from 'nestjs-i18n';

async function bootstrap () {
  const app = await NestFactory.create( AppModule );
  const config = app.get( ConfigService );
  app.useGlobalFilters( new I18nValidationExceptionFilter() );
  app.useGlobalPipes( new ValidationPipe( { exceptionFactory: i18nValidationErrorFactory, whitelist: true } ) );
  app.use( cookieParser( config.get( 'COOKIE_SECRET' ) ) );
  await app.listen( 3000 );
}
bootstrap();
