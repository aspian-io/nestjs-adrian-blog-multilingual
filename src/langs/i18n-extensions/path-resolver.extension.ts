import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { I18nResolver } from "nestjs-i18n";
import { EnvEnum } from "src/env.enum";
import { LangsService } from "../langs.service";

@Injectable()
export class PathResolver implements I18nResolver {
  constructor (
    private readonly langsService: LangsService,
    private readonly configService: ConfigService
  ) { }

  async resolve ( context: ExecutionContext ): Promise<string | string[]> {
    const req: Request = context.switchToHttp().getRequest();
    const defaultLang = await this.langsService.findDefaultLang( null, true );
    req.defaultLang = defaultLang;

    if ( this.configService.getOrThrow( EnvEnum.I18N_MULTILINGUAL_ENABLED ) === "true" ) {
      const host: string = req.hostname;
      const lang = host.split( '.' )[ 0 ];
      const foundLang = await this.langsService.findByLocaLeName( lang, null, true );

      if ( !foundLang || !foundLang?.selected ) {
        req.currentLang = defaultLang;
        return defaultLang?.localeName || undefined;
      }

      req.currentLang = foundLang;
      return foundLang.localeName;
    }

    req.currentLang = defaultLang;
    return defaultLang?.localeName || undefined;
  }
}