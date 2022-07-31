import { BadRequestException, CACHE_MANAGER, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { LangsErrorsLocale } from 'src/i18n/locale-keys/langs/errors.locale';
import { LangsInfoLocale } from 'src/i18n/locale-keys/langs/info.locale';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { Repository } from 'typeorm';
import { CreateLangDto } from './dto/create-lang.dto';
import { UpdateLangDto } from './dto/update-lang.dto';
import { Lang } from './entities/lang.entity';

@Injectable()
export class LangsService {
  constructor (
    @InjectRepository( Lang ) private readonly langRepository: Repository<Lang>,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    private readonly settingsService: SettingsService,
  ) { }

  // Create new language
  async create ( createLangDto: CreateLangDto, metadata: IMetadataDecorator ): Promise<Lang> {
    const lang = this.langRepository.create( { ...createLangDto, ipAddress: metadata.ipAddress, userAgent: metadata.userAgent } );

    await this.cacheManager.reset();
    return this.langRepository.save( lang );
  }

  // Get all languages
  findAll (): Promise<Lang[]> {
    return this.langRepository.find();
  }

  // Find a single language by its id
  async findOne ( id: string, i18n?: I18nContext ): Promise<Lang> {
    const lang = await this.langRepository.findOne( { where: { id } } );
    if ( !lang ) {
      if ( i18n ) {
        throw new NotFoundLocalizedException( i18n, LangsInfoLocale.TERM_LANG );
      }
      throw new NotFoundException( "Language Not Found" );
    }

    return lang;
  }

  // Find default language
  async findDefaultLang ( i18n?: I18nContext, ignoreErrors: boolean = false ): Promise<Lang> {
    const cacheKey = `LANGS__SERVICE_LEVEL_CACHE__DEFAULT_LANG`;
    const cachedResult: Lang | null = await this.cacheManager.get( cacheKey );

    if ( !cachedResult ) {
      const defaultLangId = ( await this.settingsService.findOne( SettingsKeyEnum.TRANSLATION_DEFAULT_LANG, i18n ) ).value;
      if ( ignoreErrors ) {
        const defaultLangOrNull = await this.langRepository.findOne( { where: { id: defaultLangId } } );
        if ( defaultLangOrNull ) await this.cacheManager.set( cacheKey, defaultLangOrNull, { ttl: 60 * 60 * 24 } );
        return defaultLangOrNull;
      }

      const defaultLang = await this.findOne( defaultLangId );
      await this.cacheManager.set( cacheKey, defaultLang, { ttl: 60 * 60 * 24 } );
      return defaultLang;
    }

    return cachedResult;
  }

  // Find language by its localeName
  async findByLocaLeName ( localeName: string, i18n?: I18nContext, ignoreErrors: boolean = false ): Promise<Lang> {
    const cacheKey = `LANGS__SERVICE_LEVEL_CACHE__FIND_BY_LOCALE_${ localeName }`;
    const cachedResult: Lang | null = await this.cacheManager.get( cacheKey );

    if ( !cachedResult ) {
      const lang = await this.langRepository.findOne( { where: { localeName } } );
      if ( lang ) await this.cacheManager.set( cacheKey, lang, { ttl: 60 * 60 * 24 } );
      if ( ignoreErrors ) return lang;

      if ( !lang ) {
        if ( i18n ) {
          throw new NotFoundLocalizedException( i18n, LangsInfoLocale.TERM_LANG );
        }
        throw new NotFoundException( "Language Not Found" );
      }

      return lang;
    }

    return cachedResult;
  }

  // Edit an existing language
  async update ( id: string, updateLangDto: UpdateLangDto, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Lang> {
    const lang = await this.langRepository.findOne( { where: { id } } );
    if ( !lang ) throw new NotFoundLocalizedException( i18n, LangsInfoLocale.TERM_LANG );

    const defaultLang = await this.findDefaultLang( i18n );
    if ( defaultLang.id === lang.id ) {
      throw new BadRequestException( i18n.t( LangsErrorsLocale.MODIFY_DEFAULT_LANG ) );
    }

    Object.assign( lang, updateLangDto );
    lang.ipAddress = metadata.ipAddress;
    lang.userAgent = metadata.userAgent;

    await this.cacheManager.reset();
    return this.langRepository.save( lang );
  }

  // Soft remove a language
  async softRemove ( i18n: I18nContext, id: string ): Promise<Lang> {
    const lang = await this.langRepository.findOne( { where: { id } } );
    if ( !lang ) throw new NotFoundLocalizedException( i18n, LangsInfoLocale.TERM_LANG );

    const defaultLang = await this.findDefaultLang( i18n );
    if ( defaultLang.id === lang.id ) {
      throw new BadRequestException( i18n.t( LangsErrorsLocale.DELETE_DEFAULT_LANG ) );
    }

    await this.cacheManager.reset();
    return this.langRepository.softRemove( lang );
  }

  // Recover a soft-removed language
  async recover ( i18n: I18nContext, id: string ): Promise<Lang> {
    const lang = await this.langRepository.findOne( { where: { id }, withDeleted: true } );
    if ( !lang ) throw new NotFoundLocalizedException( i18n, LangsInfoLocale.TERM_LANG );

    const defaultLang = await this.findDefaultLang( i18n );
    if ( defaultLang.id === lang.id ) {
      throw new BadRequestException( i18n.t( LangsErrorsLocale.DELETE_DEFAULT_LANG ) );
    }

    await this.cacheManager.reset();
    return this.langRepository.recover( lang );
  }

  // Remove a language permanently
  async remove ( id: string, i18n: I18nContext ): Promise<Lang> {
    const lang = await this.langRepository.findOne( { where: { id } } );
    if ( !lang ) throw new NotFoundLocalizedException( i18n, LangsInfoLocale.TERM_LANG );

    const defaultLang = await this.findDefaultLang( i18n );
    if ( defaultLang.id === lang.id ) {
      throw new BadRequestException( i18n.t( LangsErrorsLocale.DELETE_DEFAULT_LANG ) );
    }

    await this.cacheManager.reset();
    return this.langRepository.remove( lang );
  }
}
