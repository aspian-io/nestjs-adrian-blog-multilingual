import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { TaxonomiesErrorsLocale } from 'src/i18n/locale-keys/taxonomies/errors.locale';
import { TaxonomiesInfoLocale } from 'src/i18n/locale-keys/taxonomies/info.locale';
import { LangsService } from 'src/langs/langs.service';
import { Between, In, Not, Repository } from 'typeorm';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { TaxonomiesListQueryDto } from './dto/taxonomy-list-query.dto';
import { UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
import { TaxonomyMeta } from './entities/taxonomy-meta.entity';
import { Taxonomy, TaxonomyTypeEnum } from './entities/taxonomy.entity';

@Injectable()
export class TaxonomiesService {
  constructor (
    @InjectRepository( Taxonomy ) private readonly taxonomyRepository: Repository<Taxonomy>,
    @InjectRepository( TaxonomyMeta ) private readonly taxonomyMetaRepository: Repository<TaxonomyMeta>,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    private readonly langsService: LangsService
  ) { }

  // Create a new taxonomy
  async create (
    createTaxonomyDto: CreateTaxonomyDto,
    i18n: I18nContext,
    metadata: IMetadataDecorator ): Promise<Taxonomy> {
    const { type, parentId, meta, order } = createTaxonomyDto;
    // Default info must be defined
    if ( !createTaxonomyDto.meta.some( m => m.langId === metadata.defaultLang.id ) ) {
      throw new BadRequestException( i18n.t( CommonErrorsLocale.Default_Info_Not_Defined ) );
    }

    await Promise.all( meta.map( async m => {
      // Check for taxonomy duplication
      await this.checkTaxonomyDuplication( type, m.term, i18n );

      // Check for taxonomy's slug duplication
      await this.checkTaxonomySlugDuplication( type, m.slug, i18n );

      // Check existence of received langId and throwing error if not found
      await this.langsService.findOne( m.langId );

      // Check for meta language duplication
      if ( meta.filter( cm => cm.langId === m.langId ).length > 1 ) {
        throw new BadRequestException( i18n.t( CommonErrorsLocale.Duplicate_Meta_Lang ) );
      }
    } ) );

    // Create taxonomy
    const taxonomy = this.taxonomyRepository.create( {
      type,
      parent: { id: parentId },
      order,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      meta: meta.map( m => ( {
        ...m,
        lang: { id: m.langId },
        featuredImage: { id: m.featuredImageId },
        createdBy: { id: metadata?.user?.id },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      } ) )
    } );

    const result = await this.taxonomyRepository.save( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Find all taxonomies and search and filter and pagination
  async findAll ( query: TaxonomiesListQueryDto, type?: TaxonomyTypeEnum ): Promise<IListResultGenerator<Taxonomy>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // Get the result from database
    const [ items, totalItems ] = await this.taxonomyRepository.findAndCount( {
      relations: {
        meta: { lang: true },
      },
      where: {
        type,
        meta: {
          term: query[ 'searchBy.term' ],
          description: query[ 'searchBy.description' ],
          lang: {
            localeName: query[ 'filterBy.lang' ]?.length ? In( query[ 'filterBy.lang' ] ) : undefined
          },
          createdAt: query[ 'filterBy.createdAt' ]?.length
            ? Between( query[ 'filterBy.createdAt' ][ 0 ], query[ 'filterBy.createdAt' ][ 1 ] )
            : undefined,
          updatedAt: query[ 'filterBy.updatedAt' ]?.length
            ? Between( query[ 'filterBy.updatedAt' ][ 0 ], query[ 'filterBy.updatedAt' ][ 1 ] )
            : undefined,
        }
      },
      order: {
        meta: {
          term: query[ 'orderBy.term' ],
          description: query[ 'orderBy.description' ],
          createdAt: query[ 'orderBy.createdAt' ],
          updatedAt: query[ 'orderBy.updatedAt' ],
          ipAddress: query[ 'orderBy.ipAddress' ],
          userAgent: query[ 'orderBy.userAgent' ],
        }
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find a taxonomy
  async findOne ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Taxonomy> {
    const taxonomy = await this.taxonomyRepository.findOne( {
      where: { id },
      relations: {
        parent: true,
        children: true,
        meta: true,
      },
      withDeleted
    } );

    if ( !taxonomy ) throw new NotFoundLocalizedException( i18n, TaxonomiesInfoLocale.TERM_TAXONOMY );
    return taxonomy;
  }

  // Update a taxonomy
  async update (
    id: string,
    updateTaxonomyDto: UpdateTaxonomyDto,
    i18n: I18nContext,
    metadata: IMetadataDecorator ): Promise<Taxonomy> {
    const { meta } = updateTaxonomyDto;
    // Find Taxonomy
    const taxonomy = await this.findOne( id, i18n );

    if ( taxonomy.meta.some( m => m.lang.id === metadata.defaultLang.id )
      && !updateTaxonomyDto.meta.some( m => m.langId === metadata.defaultLang.id )
    ) {
      throw new BadRequestException( i18n.t( CommonErrorsLocale.Delete_Default_info ) );
    }

    // Delete metadata
    const metaToRemove = taxonomy.meta.filter( m => meta.some( um => um?.id !== m.id ) );
    if ( metaToRemove?.length ) {
      await Promise.all( metaToRemove.map( async m => await this.removeMeta( m.id, i18n ) ) );
    }

    // Assign update dto to original taxonomy object
    Object.assign( taxonomy, updateTaxonomyDto );

    const taxonomyMetaCheckPromises = () => meta.map( async m => {

      // Check for slug duplication
      const duplicateTaxonomy = await this.taxonomyMetaRepository.findOne( {
        where: {
          id: m?.id ? Not( m.id ) : undefined,
          slug: m.slug
        }
      } );
      // Throw slug duplication error
      if ( duplicateTaxonomy ) {
        throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY_SLUG ) );
      }

      // Check for meta language duplication
      if ( meta.filter( um => um.langId === m.langId ).length > 1 ) {
        throw new BadRequestException( i18n.t( CommonErrorsLocale.Duplicate_Meta_Lang ) );
      }
    } );
    await Promise.all( taxonomyMetaCheckPromises() );

    taxonomy.meta = updateTaxonomyDto.meta.map( m => ( {
      ...m,
      lang: { id: m.langId },
      featuredImage: { id: m?.featuredImageId },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    } ) as any );

    if ( updateTaxonomyDto?.parentId ) {
      taxonomy.parent = { id: updateTaxonomyDto.parentId } as Taxonomy;
    }

    taxonomy.ipAddress = metadata.ipAddress;
    taxonomy.userAgent = metadata.userAgent;

    const result = await this.taxonomyRepository.save( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Remove meta
  async removeMeta ( id: string, i18n: I18nContext ) {
    const meta = await this.taxonomyMetaRepository.findOne( { where: { id } } );
    if ( !meta ) throw new NotFoundLocalizedException( i18n, TaxonomiesInfoLocale.TERM_TAXONOMY_META );

    const result = await this.taxonomyMetaRepository.remove( meta );
    await this.cacheManager.reset();

    return result;
  }

  // Soft remove a taxonomy
  async softRemove ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n );

    const result = await this.taxonomyRepository.softRemove( taxonomy );
    await this.cacheManager.reset();
    return result;
  }

  // Recover a soft-removed taxonomy
  async recover ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n );

    const result = await this.taxonomyRepository.recover( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Remove a taxonomy permanently
  async remove ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n );

    const result = await this.taxonomyRepository.remove( taxonomy );
    await this.cacheManager.reset();

    return result;
  }



  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  // Check taxonomy duplication
  async checkTaxonomyDuplication ( taxonomyType: TaxonomyTypeEnum, taxonomyMetaTerm: string, i18n: I18nContext ): Promise<void> {
    // Check for taxonomy duplication
    const duplicateTaxonomy = await this.taxonomyRepository.findOne( {
      relations: {
        meta: true
      },
      where: {
        type: taxonomyType,
        meta: {
          term: taxonomyMetaTerm
        }
      }
    } );
    // Throw taxonomy duplication error
    if ( duplicateTaxonomy ) throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY ) );
  }

  // Check taxonomy slug duplication
  async checkTaxonomySlugDuplication ( taxonomyType: TaxonomyTypeEnum, taxonomyMetaSlug: string, i18n: I18nContext ): Promise<void> {
    // Check for taxonomy's slug duplication
    const duplicateSlug = await this.taxonomyRepository.findOne( {
      relations: {
        meta: true
      },
      where: {
        type: taxonomyType,
        meta: {
          slug: taxonomyMetaSlug
        }
      }
    } );
    // Throw slug duplication error
    if ( duplicateSlug ) throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY_SLUG ) );
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}
