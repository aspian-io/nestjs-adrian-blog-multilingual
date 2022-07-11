import { CacheInterceptor, CacheModule, CacheModuleOptions, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LangsModule } from './langs/langs.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { FilesModule } from './files/files.module';
import { AppSeederService } from './app-seeder.service';
import { I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { PathResolver } from './langs/i18n-extensions/path-resolver.extension';
import { envValidations } from './common/validation-schemas/env-validations.schema';
import * as redisStore from 'cache-manager-redis-store';
import type { ClientOpts } from 'redis';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module( {
  imports: [
    ConfigModule.forRoot( {
      isGlobal: true,
      cache: true,
      validationSchema: envValidations
    } ),
    CacheModule.registerAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      isGlobal: true,
      useFactory: ( configService: ConfigService ): CacheModuleOptions<ClientOpts> => ( {
        store: redisStore,
        host: configService.getOrThrow( 'REDIS_HOST' ),
        port: configService.getOrThrow( 'REDIS_PORT' ),
        auth_pass: configService.getOrThrow( 'REDIS_PASSWORD' ),
        ttl: 10, // seconds
        max: 200, // maximum number of items in cache
      } ),
    } ),
    I18nModule.forRootAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      resolvers: [
        PathResolver
      ],
      useFactory: ( configService: ConfigService ) => ( {
        fallbackLanguage: configService.getOrThrow( 'DEFAULT_LANG' ),
        loaderOptions: {
          path: path.join( __dirname, '/i18n/' ),
          watch: true,
        },
      } )
    } ),
    TypeOrmModule.forRootAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ) => ( {
        type: configService.getOrThrow<any>( 'DB_TYPE' ),
        host: configService.getOrThrow( 'DB_HOST' ),
        port: configService.getOrThrow( 'DB_PORT' ),
        username: configService.getOrThrow( 'DB_USERNAME' ),
        password: configService.getOrThrow( 'DB_PASSWORD' ),
        database: configService.getOrThrow<string>( 'DB_NAME' ),
        autoLoadEntities: true,
        synchronize: configService.getOrThrow( 'NODE_ENV' ) === 'development',
        // cache: {
        //   type: "redis",
        //   options: {
        //     host: configService.getOrThrow( 'REDIS_HOST' ),
        //     port: configService.getOrThrow( 'REDIS_PORT' ),
        //     auth_pass: configService.getOrThrow( 'REDIS_PASSWORD' ),
        //   }
        // }
        //logging: true
      } )
    } ),
    LangsModule,
    UsersModule,
    SettingsModule,
    FilesModule,
  ],
  controllers: [ AppController ],
  providers: [ AppService, AppSeederService, {
    provide: APP_INTERCEPTOR,
    useClass: CacheInterceptor,
  } ],
} )

export class AppModule { }
