import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { File } from 'src/files/entities/file.entity';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { PostsErrorsLocale } from 'src/i18n/locale-keys/posts/errors.locale';
import { PostsInfoLocale } from 'src/i18n/locale-keys/posts/info.locale';
import { LangsService } from 'src/langs/langs.service';
import { Taxonomy, TaxonomyTypeEnum } from 'src/taxonomies/entities/taxonomy.entity';
import { Between, FindOptionsOrder, FindOptionsWhere, In, IsNull, MoreThanOrEqual, Not, Raw, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryListDto } from './dto/post-query-list.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UserBlogsListDto } from './dto/user/user-blog-list.dto';
import { PostMeta } from './entities/post-meta.entity';
import { Post, PostStatusEnum, PostTypeEnum } from './entities/post.entity';
import { IScheduledPostPayload } from './queues/consumers/scheduled-post.consumer';
import { PostJobs } from './queues/jobs.enum';
import { PostQueues } from './queues/queues.enum';

@Injectable()
export class PostsService {
  constructor (
    @InjectRepository( Post ) private readonly postRepository: Repository<Post>,
    @InjectRepository( PostMeta ) private readonly postMetaRepository: Repository<PostMeta>,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    @InjectQueue( PostQueues.SCHEDULED_POSTS ) private readonly scheduledPostQueue: Queue<IScheduledPostPayload>,
    private readonly langsService: LangsService,
  ) { }

  // Create a new post
  async create ( createPostDto: CreatePostDto, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Post> {
    // Default info must be defined
    if ( !createPostDto.meta.some( m => m.langId === metadata.defaultLang.id ) ) {
      throw new BadRequestException( i18n.t( CommonErrorsLocale.Default_Info_Not_Defined ) );
    }
    // Check post meta info
    const postMetaCheckPromises = ( () => createPostDto.meta.map( async pm => {
      // Check for slug duplication
      const duplicatePost = await this.postMetaRepository.findOne( {
        where: {
          slug: pm.slug
        }
      } );
      // Throw slug duplication error
      if ( duplicatePost ) throw new BadRequestException( i18n.t( PostsErrorsLocale.DUPLICATE_POST_SLUG ) );

      if ( createPostDto.meta.filter( cm => cm.langId === pm.langId ).length > 1 ) {
        throw new BadRequestException( i18n.t( CommonErrorsLocale.Duplicate_Meta_Lang ) );
      }
    } ) );
    await Promise.all( postMetaCheckPromises() );

    const post = this.postRepository.create( {
      ...createPostDto,
      status: createPostDto?.scheduledToPublish ? PostStatusEnum.FUTURE : createPostDto.status,
      parent: { id: createPostDto?.parentId },
      taxonomies: [ ...new Set( createPostDto.taxonomiesIds ) ].map( tid => ( { id: tid } ) ),
      attachments: [ ...new Set( createPostDto.attachmentsIds ) ].map( aid => ( { id: aid } ) ),
      createdBy: { id: metadata?.user?.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      meta: createPostDto.meta.map( m => ( {
        ...m,
        lang: { id: m.langId },
        featuredImage: { id: m?.featuredImageId },
        createdBy: { id: metadata?.user?.id },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      } ) )
    } );

    // Save post into the database
    const result = await this.postRepository.save( post );

    // reset cache
    await this.cacheManager.reset();

    // Add scheduled post jobs to queue
    await this.addScheduledPostJobToQueue( result );

    return result;
  }

  // Find and filter and paginate posts
  async findAll ( query: PostsQueryListDto | UserBlogsListDto, type: PostTypeEnum ): Promise<IListResultGenerator<Post>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );
    // TypeORM where object
    const where: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = {
      type,
      taxonomies: [],
      visibility: query[ 'filterBy.visibility' ],
      status: query[ 'filterBy.status' ]?.length
        ? In( query[ 'filterBy.status' ] )
        : undefined,
      scheduledToPublish: query[ 'filterBy.scheduledToPublish' ]?.length
        ? Between( query[ 'filterBy.scheduledToPublish' ][ 0 ], query[ 'filterBy.scheduledToPublish' ][ 1 ] )
        : undefined,
      scheduledToArchive: query[ 'filterBy.scheduledToArchive' ]?.length
        ? Between( query[ 'filterBy.scheduledToArchive' ][ 0 ], query[ 'filterBy.scheduledToArchive' ][ 1 ] )
        : undefined,
      commentAllowed: query[ 'filterBy.commentAllowed' ],
      isPinned: query[ 'filterBy.isPinned' ],
      createdAt: query[ 'filterBy.createdAt' ]?.length
        ? Between( query[ 'filterBy.createdAt' ][ 0 ], query[ 'filterBy.createdAt' ][ 1 ] )
        : undefined,
      updatedAt: query[ 'filterBy.updatedAt' ]?.length
        ? Between( query[ 'filterBy.updatedAt' ][ 0 ], query[ 'filterBy.updatedAt' ][ 1 ] )
        : undefined,
      meta: {
        lang: {
          localeName: query[ 'filterBy.lang' ]?.length ? In( query[ 'filterBy.lang' ] ) : undefined
        },
        featuredImage: {
          filename: query[ 'filterBy.featuredImage' ]
        }
      }
    };

    // Add likes number filter
    if ( query[ 'filterBy.likesNumGte' ] ) {
      where.likesNum = MoreThanOrEqual( query[ 'filterBy.likesNumGte' ] );
    }
    // Add bookmarks number filter
    if ( query[ 'filterBy.bookmarksNumGte' ] ) {
      where.bookmarksNum = MoreThanOrEqual( query[ 'filterBy.bookmarksNumGte' ] );
    }
    // Add parent title filter
    if ( query[ 'filterBy.parentTitle' ] ) {
      where.parent = {
        meta: {
          title: query[ 'filterBy.parentTitle' ]
        }
      };
    }
    // Add category terms filter
    if ( query[ 'filterBy.categoryTerms' ]?.length ) {
      where.taxonomies[ 0 ] = {
        type: TaxonomyTypeEnum.CATEGORY,
        meta: {
          term: In( query[ 'filterBy.categoryTerms' ] )
        }
      };
    }
    // Add tag terms filter
    if ( query[ 'filterBy.tagTerms' ]?.length ) {
      where.taxonomies[ 1 ] = {
        type: TaxonomyTypeEnum.TAG,
        meta: {
          term: In( query[ 'filterBy.tagTerms' ] )
        }
      };
    }
    // Add attachment filename filter
    if ( query[ 'filterBy.filenames' ]?.length ) {
      where.attachments = {
        filename: In( query[ 'filterBy.filenames' ] )
      };
    }
    // Add createdBy filter
    if ( query[ 'filterBy.createdBy' ] ) {
      where.createdBy = [
        { email: In( query[ 'filterBy.createdBy' ] ) },
        { mobilePhone: In( query[ 'filterBy.createdBy' ] ) }
      ];
    }
    // Add updatedBy filter
    if ( query[ 'filterBy.updatedBy' ] ) {
      where.updatedBy = [
        { email: In( query[ 'filterBy.updatedBy' ] ) },
        { mobilePhone: In( query[ 'filterBy.updatedBy' ] ) }
      ];
    }

    // TypeORM order object
    const order: FindOptionsOrder<Post> = {
      viewCount: query[ 'orderBy.viewCount' ],
      likesNum: query[ 'orderBy.likesNum' ],
      bookmarksNum: query[ 'orderBy.bookmarksNum' ],
      createdAt: query[ 'orderBy.createdAt' ],
      updatedAt: query[ 'orderBy.updatedAt' ],
      ipAddress: query[ 'orderBy.ipAddress' ],
      userAgent: query[ 'orderBy.userAgent' ],
      meta: {
        title: query[ 'orderBy.title' ],
        subtitle: query[ 'orderBy.subtitle' ],
      }
    };

    // Get the result from database
    const [ items, totalItems ] = await this.postRepository.findAndCount( {
      relations: {
        attachments: true,
        createdBy: true,
        updatedBy: true,
        meta: { featuredImage: true },
        parent: { meta: true },
        taxonomies: { meta: true }
      },
      where,
      order,
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find a post
  async findOne ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Post> {
    const post = await this.postRepository.findOne( {
      relations: {
        taxonomies: true,
        attachments: true,
        bookmarks: true,
        likes: true,
        parent: true,
        child: true,
        meta: true,
        createdBy: true,
        updatedBy: true,
      },
      where: {
        id
      },
      withDeleted
    } );

    if ( !post ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );

    return post;
  }

  // Find a post by slug
  async findBySlug ( slug: string, i18n: I18nContext, metadata: IMetadataDecorator ) {
    const post = await this.postRepository.findOne( {
      relations: {
        taxonomies: { meta: { lang: true } },
        attachments: true,
        child: { meta: true },
        parent: { meta: true },
        createdBy: { meta: true },
        updatedBy: { meta: true },

        meta: {
          featuredImage: true,
          lang: true,
        },
      },
      where: {
        meta: {
          lang: {
            id: metadata.lang.id
          },
          slug
        },
        taxonomies: [
          { meta: { lang: { id: metadata.lang.id } } },
          { meta: { lang: { id: metadata.defaultLang.id } } }
        ]
      }
    } );

    if ( !post ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );
    post.viewCount++;
    await this.postRepository.save( post );


    return post;
  }

  // Update a post and its related meta
  async update ( id: string, updatePostDto: UpdatePostDto, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Post> {
    const post = await this.findOne( id, i18n );

    if ( post.meta.some( m => m.lang.id === metadata.defaultLang.id )
      && !updatePostDto.meta.some( m => m.langId === metadata.defaultLang.id )
    ) {
      throw new BadRequestException( i18n.t( CommonErrorsLocale.Delete_Default_info ) );
    }

    // Delete metadata
    const metaToRemove = post.meta.filter( m => updatePostDto.meta.some( um => um?.id !== m.id ) );
    if ( metaToRemove?.length ) {
      await Promise.all( metaToRemove.map( async m => await this.removeMeta( m.id, i18n ) ) );
    }

    Object.assign( post, updatePostDto );

    const postMetaCheckPromises = () => updatePostDto.meta.map( async pm => {
      // Check for slug duplication
      const duplicatePost = await this.postMetaRepository.findOne( {
        where: {
          id: pm?.id ? Not( pm.id ) : undefined,
          slug: pm.slug
        }
      } );
      // Throw slug duplication error
      if ( duplicatePost ) throw new BadRequestException( i18n.t( PostsErrorsLocale.DUPLICATE_POST_SLUG ) );

      if ( updatePostDto.meta.filter( cm => cm.langId === pm.langId ).length > 1 ) {
        throw new BadRequestException( i18n.t( CommonErrorsLocale.Duplicate_Meta_Lang ) );
      }
    } );
    await Promise.all( postMetaCheckPromises() );

    post.meta = updatePostDto.meta.map( m => ( {
      ...m,
      lang: { id: m.langId },
      featuredImage: { id: m?.featuredImageId },
      createdBy: { id: metadata?.user?.id },
      updatedBy: { id: metadata?.user?.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    } ) as any );

    if ( updatePostDto?.taxonomiesIds ) {
      post.taxonomies = updatePostDto?.taxonomiesIds?.length
        ? updatePostDto.taxonomiesIds.map( tid => ( { id: tid } ) ) as Taxonomy[]
        : [];
    }

    if ( updatePostDto?.attachmentsIds ) {
      post.attachments = updatePostDto?.attachmentsIds?.length
        ? updatePostDto?.attachmentsIds.map( aid => ( { id: aid } ) ) as File[]
        : [];
    }

    if ( updatePostDto?.parentId ) {
      post.parent = { id: updatePostDto?.parentId } as Post;
    }

    const result = await this.postRepository.save( post );
    await this.cacheManager.reset();

    return result;
  }

  // Remove meta
  async removeMeta ( id: string, i18n: I18nContext ) {
    const meta = await this.postMetaRepository.findOne( { where: { id } } );
    if ( !meta ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST_META );

    const result = await this.postMetaRepository.remove( meta );
    await this.cacheManager.reset();

    return result;
  }

  // Soft remove a post
  async softRemove ( id: string, i18n: I18nContext ) {
    const post = await this.findOne( id, i18n, true );

    const result = await this.postRepository.softRemove( post );
    await this.cacheManager.reset();

    return result;
  }

  // Recover soft-removed post
  async recover ( id: string, i18n: I18nContext ) {
    const post = await this.findOne( id, i18n, true );

    const result = await this.postRepository.recover( post );
    await this.cacheManager.reset();

    return result;
  }

  // Remove a post permanently
  async remove ( id: string, i18n: I18nContext ) {
    const post = await this.findOne( id, i18n, true );

    const result = await this.postRepository.remove( post );
    await this.cacheManager.reset();

    return result;
  }


  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  // Add scheduled post jobs to queue
  async addScheduledPostJobToQueue ( post: Post ) {
    // Schedule to publish if schedule date exists
    if ( post?.scheduledToPublish ) {
      const delay = post.scheduledToPublish.getTime() - Date.now();
      await this.scheduledPostQueue.add( PostJobs.SCHEDULED_POST_TO_PUBLISH, { id: post.id }, { delay } );
    }

    // Schedule to archive if schedule date exists
    if ( post?.scheduledToArchive ) {
      const delay = post.scheduledToArchive.getTime() - Date.now();
      await this.scheduledPostQueue.add( PostJobs.SCHEDULED_POST_TO_ARCHIVE, { id: post.id }, { delay } );
    }
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}
