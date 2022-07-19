import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { i18nValidationErrorFactory, I18nValidationExceptionFilter } from 'nestjs-i18n';
import * as companion from '@uppy/companion';
import { EnvEnum } from './env.enum';

async function bootstrap () {
  const app = await NestFactory.create( AppModule );
  app.enableCors( {
    origin: "*",
    credentials: true,
    allowedHeaders: [
      'Authorization',
      "x-amz-date",
      "x-amz-content-sha256",
      'Origin',
      'Content-Type',
      'Accept',
      'uppy-auth-token'
    ],
    exposedHeaders: [ "ETag" ],
    methods: [ 'get', 'post', 'put', 'patch', 'OPTIONS', 'delete', 'DELETE' ],
    optionsSuccessStatus: 200,
  } );
  const config = app.get( ConfigService );
  app.useGlobalFilters( new I18nValidationExceptionFilter() );
  app.useGlobalPipes( new ValidationPipe( { exceptionFactory: i18nValidationErrorFactory, transform: true, whitelist: true } ) );
  app.use( cookieParser( config.get( EnvEnum.COOKIE_SECRET ) ) );
  const server = await app.listen( 3000 );
  // Uppy companion socket
  companion.socket( server );
}
bootstrap();
