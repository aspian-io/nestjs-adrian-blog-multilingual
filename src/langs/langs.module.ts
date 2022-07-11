import { Global, Module } from '@nestjs/common';
import { LangsService } from './langs.service';
import { LangsController } from './langs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lang } from './entities/lang.entity';
import { PathResolver } from './i18n-extensions/path-resolver.extension';

@Global()
@Module( {
  imports: [ TypeOrmModule.forFeature( [ Lang ] ) ],
  controllers: [ LangsController ],
  providers: [ LangsService, PathResolver],
  exports: [ TypeOrmModule, LangsService ]
} )

export class LangsModule { }
