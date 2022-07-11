import { BadRequestException, CACHE_MANAGER, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { In, Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserMeta } from './entities/user-meta.entity';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserLoginDto } from './dto/login-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { IServiceUserLoginResult, IServiceUserRefreshTokensResult, IServiceUserRegisterResult } from './types/services.type';
import { I18nContext } from 'nestjs-i18n';
import { UsersInfoLocale } from 'src/i18n/locale-keys/users/info.locale';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { UsersErrorsLocal } from 'src/i18n/locale-keys/users/errors.locale';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { Claim } from './entities/claim.entity';
import { AddMetaDto } from './dto/add-meta.dto';
import { LangsService } from 'src/langs/langs.service';
import { LangsInfoLocale } from 'src/i18n/locale-keys/langs/info.locale';
import { paginate } from 'nestjs-typeorm-paginate';
import { UsersListQueryDto } from './dto/users-list-query.dto';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor (
    @InjectRepository( User ) private readonly userRepository: Repository<User>,
    @InjectRepository( UserMeta ) private readonly userMetaRepository: Repository<UserMeta>,
    @InjectRepository( Claim ) private readonly claimRepository: Repository<Claim>,
    private readonly langsService: LangsService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache
  ) { }

  // Login Service (Local JWT)
  async loginLocal ( i18n: I18nContext, userLoginDto: UserLoginDto ): Promise<IServiceUserLoginResult> {
    const user = await this.userRepository.findOne( { where: { email: userLoginDto.username }, relations: { claims: true } } );
    if ( !user ) throw new NotFoundException( i18n.t( UsersErrorsLocal.INCORRECT_CREDENTIALS ) );

    const passwordMatch = await bcrypt.compare( userLoginDto.password, user.password );
    if ( !passwordMatch ) throw new BadRequestException( i18n.t( UsersErrorsLocal.INCORRECT_CREDENTIALS ) );

    if ( user.suspend && user.suspend.getTime() > Date.now() ) {
      throw new ForbiddenException( i18n.t( UsersErrorsLocal.USER_SUSPENDED ) );
    }

    const accessToken = await this.generateAccessToken( user.id, user.email, user.claims.map( c => c.name ) );
    const refreshToken = await this.generateRefreshToken( user.id, user.email );

    return {
      data: {
        ...user
      },
      meta: {
        accessToken,
        refreshToken
      }
    };
  }

  // Register Service (Local JWT)
  async registerLocal ( i18n: I18nContext, createUserDto: CreateUserDto, metadata: IMetadataDecorator ): Promise<IServiceUserRegisterResult> {
    const user = await this.create( i18n, createUserDto, metadata );
    const accessToken = await this.generateAccessToken( user.id, user.email, [] );
    const refreshToken = await this.generateRefreshToken( user.id, user.email );

    return {
      data: {
        ...user
      },
      meta: {
        accessToken,
        refreshToken
      }
    };
  }

  // Create a new user
  async create ( i18n: I18nContext, createUserDto: CreateUserDto, metadata: IMetadataDecorator ): Promise<User> {
    const { defaultLang, ipAddress, userAgent } = metadata;
    const existingUser = await this.userRepository.findOne( { where: { email: createUserDto.data.email } } );
    if ( existingUser ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_IN_USE ) );
    }
    // Check if new mobile phone is in use
    if ( createUserDto.data.mobilePhone ) {
      const duplicateMobilePhone = await this.userRepository.findOne( { where: { mobilePhone: createUserDto.data.mobilePhone } } );
      if ( duplicateMobilePhone ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );
    }
    // Hashing password
    const hash = await this.hash( createUserDto.data.password );

    const user = this.userRepository.create( {
      ...createUserDto.data,
      password: hash, // replace hashed password
      ipAddress,
      userAgent
    } );
    const userMeta = this.userMetaRepository.create( { ...createUserDto.metadata, lang: defaultLang, ipAddress, userAgent } );
    user.meta = [ userMeta ];

    await this.cacheManager.reset();
    return await this.userRepository.save( user );
  }

  // Refresh access and refresh tokens
  async refreshTokens ( refreshToken: string ): Promise<IServiceUserRefreshTokensResult> {
    try {
      const decodedRt = await this.jwtService.verifyAsync( refreshToken, { secret: this.configService.getOrThrow( 'REFRESH_TOKEN_SECRET' ) } );
      const user = await this.userRepository.findOne( { where: { id: decodedRt[ 'sub' ] }, relations: { claims: true } } );
      if ( !user ) throw new ForbiddenException();
      if ( user.suspend && user.suspend.getTime() > Date.now() ) {
        throw new ForbiddenException();
      }
      const accessToken = await this.generateAccessToken( user.id, user.email, user.claims.map( c => c.name ) );
      const newRefreshToken = await this.generateRefreshToken( user.id, user.email );
      return {
        data: { ...user },
        meta: { accessToken, refreshToken: newRefreshToken }
      };
    } catch ( error ) {
      throw new ForbiddenException();
    }
  }

  // Add user meta
  async addMeta ( userId: string, body: AddMetaDto, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<UserMeta> {
    const { ipAddress, userAgent } = metadata;
    const user = await this.userRepository.findOne( { where: { id: userId }, relations: { meta: { lang: true } } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    const duplicateMeta = user.meta.filter( m => m.lang.id === body.langId );
    if ( duplicateMeta.length ) throw new BadRequestException( i18n.t( UsersErrorsLocal.DUPLICATE_INFO ) );

    const lang = await this.langsService.findOne( body.langId );
    if ( !lang ) throw new NotFoundLocalizedException( i18n, LangsInfoLocale.TERM_LANG );

    const meta = this.userMetaRepository.create( { ...body, lang, user, ipAddress, userAgent } );

    await this.cacheManager.reset();
    return this.userMetaRepository.save( meta );
  }

  // Find all users
  findAll ( query: UsersListQueryDto ) {
    const search = query[ 'search' ] ? `%${ query[ 'search' ] }%` : null;
    // Search fields
    const sqlFieldsToSearch = `
      user.email, 
      user.birthDate,
      user.country,
      user.state,
      user.city,
      user.address,
      user.phone, 
      user.mobilePhone, 
      user.postalCode, 
      user_meta.firstName, 
      user_meta.lastName,
      user_meta.bio
      `;
    // Sort fields
    const sortFields = [
      'user.email',
      'user.birthDate',
      'user.country',
      'user.state',
      'user.city',
      'user.address',
      'user.phone',
      'user.mobilePhone',
      'user.postalCode',
      'user.createdAt',
      'user.updatedAt',
      'user.suspend',
      'user.ipAddress',
      'user.userAgent',
      'user_meta.firstName',
      'user_meta.lastName',
      'user_meta.bio',
      'user_meta.createdAt',
      'user_meta.updatedAt',
      'user_meta.ipAddress',
      'user_meta.userAgent',
    ];

    // Filter Queries
    const claimsFilter: string[] = query[ 'filterBy.claims' ] ? query[ 'filterBy.claims' ].toString().split( ',' ) : [];
    const langFilter: string[] = query[ 'filterBy.lang' ] ? query[ 'filterBy.lang' ].toString().split( ',' ) : [];
    const suspendFilter: string = query[ 'filterBy.suspended' ] ? query[ 'filterBy.suspended' ] : null;
    // Sort Queries
    const defaultSort = [ 'user.createdAt', 'DESC' ];
    let sortParam: string[] = query[ 'orderBy' ] ? query[ 'orderBy' ].toString().split( ':' ) : defaultSort;
    if (
      sortParam.length !== 2
      || !sortFields.includes( sortParam[ 0 ] )
      || ![ 'ASC', 'DESC' ].includes( sortParam[ 1 ] )
    ) { sortParam = defaultSort; }
    // Pagination Queries
    const page: number = query[ 'page' ] && query[ 'page' ] > 0 ? query[ 'page' ] : 1;
    let limit: number = query[ 'limit' ] && query[ 'limit' ] > 0 ? query[ 'limit' ] : 10;
    if ( limit > 100 ) limit = 100;

    const queryBuilder = this.userRepository
      .createQueryBuilder( "user" )
      .leftJoinAndSelect( 'user.claims', "user_claims" )
      .leftJoinAndSelect( 'user.meta', 'user_meta' )
      .leftJoinAndSelect( 'user_meta.lang', 'meta_lang' );

    if ( claimsFilter.length ) {
      queryBuilder.where( "user_claims.name IN (:...claims)", { claims: claimsFilter } );
    }

    if ( langFilter.length ) {
      queryBuilder.andWhere( "meta_lang.localeName IN (:...localeNames)", { localeNames: langFilter } );
    }

    if ( suspendFilter ) {
      queryBuilder.andWhere( "suspend IS NOT NULL AND suspend > CURRENT_TIMESTAMP" );
    }

    if ( search ) {
      queryBuilder.andWhere( `concat_ws(' ', ${ sqlFieldsToSearch }) ILIKE coalesce(:search, concat_ws(' ', ${ sqlFieldsToSearch }))`, { search } );
    }

    queryBuilder.orderBy( sortParam[ 0 ], sortParam[ 1 ] as ( 'ASC' | 'DESC' ) );

    return paginate( queryBuilder, { page, limit } );
  }

  // Find one user
  async findOne ( id: string, i18n: I18nContext ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id }, relations: { claims: true, meta: { lang: true } } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );
    return user;
  }

  // Check to see if user is the only admin
  async isOnlyAdmin ( id: string ) {
    const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
    const isUserAdmin = await this.userRepository.findOne( { relations: { claims: true }, where: { id, claims: { id: adminClaim.id } } } );
    const adminCount = await this.userRepository.count( { relations: { claims: true }, where: { claims: { id: adminClaim.id } } } );
    return !!isUserAdmin && adminCount <= 1;
  }

  // Update user's info
  async update ( i18n: I18nContext, id: string, userBody: AdminUpdateUserDto, logData: IMetadataDecorator ): Promise<User> {

    const user = await this.userRepository.findOne( { where: { id }, relations: { claims: true, meta: { lang: true } } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );
    // Check if new email address is in use
    if ( userBody.data.email && userBody.data.email !== user.email ) {
      const duplicateEmail = await this.userRepository.findOne( { where: { id: Not( id ), email: userBody.data.email } } );
      if ( duplicateEmail ) throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_IN_USE ) );
    }
    // Check if new mobile phone is in use
    if ( userBody.data.mobilePhone && userBody.data.mobilePhone !== user.mobilePhone ) {
      const duplicateMobilePhone = await this.userRepository.findOne( { where: { id: Not( id ), mobilePhone: userBody.data.mobilePhone } } );
      if ( duplicateMobilePhone ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );
    }

    // Hash new password
    userBody.data.password = userBody.data?.password ? await this.hash( userBody.data.password ) : undefined;

    const userCopy: User = new User();
    Object.assign( userCopy, user );
    Object.assign( user, userBody.data );
    user.ipAddress = logData.ipAddress;
    user.userAgent = logData.userAgent;

    if ( !!userBody.data.claims ) {
      if ( userCopy.claims?.length ) {
        const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
        const isUserAdmin = await this.userRepository.findOne( { relations: { claims: true }, where: { id: user.id, claims: { id: adminClaim.id } } } );
        const adminCount = await this.userRepository.count( { relations: { claims: true }, where: { claims: { id: adminClaim.id } } } );
        if ( adminCount <= 1 && isUserAdmin && !userBody.data.claims.includes( adminClaim.id ) ) {
          throw new BadRequestException( i18n.t( UsersErrorsLocal.ONLY_ADMIN ) );
        }
      }
      const claims = await this.claimRepository.find( { where: { id: In( userBody.data.claims ) } } );
      user.claims = claims;
    }

    if ( userBody.metadata?.length ) {
      const meta = await Promise.all( userBody.metadata.map( async meta => {
        if ( meta.id ) {
          const metadata = await this.userMetaRepository.findOne( {
            relations: { user: true },
            where: { id: meta.id, user: { id: user.id } }
          } );
          if ( metadata ) {
            if ( meta.langId ) {
              const duplicate = await this.userMetaRepository.findOne( {
                relations: { user: true, lang: true },
                where: { id: Not( meta.id ), user: { id: user.id }, lang: { id: meta.langId } }
              } );
              if ( duplicate ) throw new BadRequestException( i18n.t( UsersErrorsLocal.DUPLICATE_INFO ) );
            }
            Object.assign( metadata, meta );
            metadata.ipAddress = logData.ipAddress;
            metadata.userAgent = logData.userAgent;
            return metadata;
          }
          throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_META );
        } else {
          throw new BadRequestException( i18n.t( UsersErrorsLocal.META_ID ) );
        }
      } ) );
      user.meta = meta;
    }

    await this.cacheManager.reset();
    return this.userRepository.save( user );
  }

  // Soft remove a user
  async softRemove ( i18n: I18nContext, id: string ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id }, relations: { meta: true } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    const isUserOnlyAdmin = await this.isOnlyAdmin( id );
    if (isUserOnlyAdmin) throw new BadRequestException( i18n.t( UsersErrorsLocal.ONLY_ADMIN ) );

    await this.cacheManager.reset();
    return this.userRepository.softRemove( user );
  }

  // Recover a soft-removed user
  async recover ( i18n: I18nContext, id: string ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id }, relations: { meta: true }, withDeleted: true } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    const isUserOnlyAdmin = await this.isOnlyAdmin( id );
    if (isUserOnlyAdmin) throw new BadRequestException( i18n.t( UsersErrorsLocal.ONLY_ADMIN ) );

    await this.cacheManager.reset();
    return this.userRepository.recover( user );
  }

  // Remove a user permanently
  async remove ( i18n: I18nContext, id: string ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id }, withDeleted: true } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    const isUserOnlyAdmin = await this.isOnlyAdmin( id );
    if (isUserOnlyAdmin) throw new BadRequestException( i18n.t( UsersErrorsLocal.ONLY_ADMIN ) );

    await this.cacheManager.reset();
    return this.userRepository.remove( user );
  }

  // Find All Claims
  findAllClaims (): Promise<Claim[]> {
    return this.claimRepository.find();
  }

  /***********************/
  /* Helper Methods Area */
  /***********************/

  // Hash data
  hash ( data: string ) {
    return bcrypt.hash( data, 10 );
  }

  // Access Token Generator
  generateAccessToken ( userId: string, email: string, claims: string[] ): Promise<string> {
    const secret = this.configService.get( 'ACCESS_TOKEN_SECRET' );
    const expiresIn = this.configService.getOrThrow( 'ACCESS_TOKEN_EXPIRATION' );

    return this.jwtService.signAsync(
      { sub: userId, email, clms: claims },
      { secret, expiresIn }
    );
  }

  // Refresh Token Generator
  generateRefreshToken ( userId: string, email: string ) {
    const secret = this.configService.get( 'REFRESH_TOKEN_SECRET' );
    const expiresIn = this.configService.getOrThrow( 'REFRESH_TOKEN_EXPIRATION' );

    return this.jwtService.signAsync(
      { sub: userId, email },
      { secret, expiresIn }
    );
  }
}
