import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { Response } from 'express';
import { Tokens } from './types/services.type';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { IJwtStrategyUser, IRtStrategyUser } from './strategies/types';
import { RtAuthGuard } from './guards/rt.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { PermissionsGuard } from './guards/require-permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { User } from './entities/user.entity';
import { IControllerUserLoginResult, IControllerUserRefreshTokensResult, IControllerUserRegisterResult } from './types/controllers.type';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Claim } from './entities/claim.entity';
import { UserMeta } from './entities/user-meta.entity';
import { EnvEnum } from 'src/env.enum';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { ObjectUtils } from 'src/common/utils/object.utils';
import { AdminAddMetaDto, AdminUpdateUserDto, AdminCreateUserDto, UpdateUserDto, UserLoginDto, UsersListQueryDto } from './dto';
import { LoginRegisterDto, UserDto } from './dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import { UpdateUserClaimsDto } from './dto/update-claims.dto';

@Controller()
export class UsersController {
  private readonly defaultLangLocaleName: string;
  constructor (
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.defaultLangLocaleName = configService.getOrThrow( EnvEnum.I18N_DEFAULT_LANG );
  }

  /************************ */
  /* Users Controllers Area */
  /************************ */

  // Login
  @Post( 'users/login' )
  @HttpCode( HttpStatus.OK )
  @Serialize( LoginRegisterDto )
  async login (
    @I18n() i18n: I18nContext,
    @Body() userLoginDto: UserLoginDto,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserLoginResult> {
    const user = await this.usersService.loginLocal( i18n, userLoginDto );
    const decodedRt = this.jwtService.decode( user.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.refreshToken,
      {
        signed: true,
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    ObjectUtils.adjustEntityMetaResultByLang( user, this.defaultLangLocaleName, i18n.lang );

    return { ...user, accessToken: user.accessToken };
  }

  // Register
  @Post( 'users/register' )
  @Serialize( LoginRegisterDto )
  async register (
    @I18n() i18n: I18nContext,
    @Body() createUserDto: AdminCreateUserDto,
    @Metadata() metadata: IMetadataDecorator,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserRegisterResult> {
    const user = await this.usersService.registerLocal( i18n, createUserDto, metadata );
    const decodedRt = this.jwtService.decode( user.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.refreshToken,
      {
        signed: true,
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    ObjectUtils.adjustEntityMetaResultByLang( user, this.defaultLangLocaleName, i18n.lang );

    return { ...user, accessToken: user.accessToken };
  }

  // Refresh Tokens
  @UseGuards( RtAuthGuard )
  @Get( 'users/refresh-tokens' )
  @Serialize( LoginRegisterDto )
  async refreshTokens (
    @CurrentUser() user: IRtStrategyUser,
    @I18n() i18n: I18nContext,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserRefreshTokensResult> {
    const result = await this.usersService.refreshTokens( user.refreshToken );
    const decodedRt = this.jwtService.decode( result.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      result.refreshToken,
      {
        signed: true,
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    ObjectUtils.adjustEntityMetaResultByLang( result, this.defaultLangLocaleName, i18n.lang );
    return { ...result, accessToken: result.accessToken };
  }

  // Logout
  @Get( 'users/logout' )
  @UseGuards( JwtAuthGuard )
  logout ( @Res( { passthrough: true } ) res: Response ): {} {
    res.clearCookie( Tokens.REFRESH_TOKEN );
    return {};
  }

  // View Profile
  @Get( 'users/profile' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  async viewProfile ( @CurrentUser() user: IJwtStrategyUser, @I18n() i18n: I18nContext ): Promise<User> {
    const profile = await this.usersService.findOne( user.userId, i18n );
    ObjectUtils.adjustEntityMetaResultByLang( profile, this.defaultLangLocaleName, i18n.lang );
    return profile;
  }

  // Edit Profile
  @Post( 'users/profile' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  async editProfile (
    @Body() body: UpdateUserDto,
    @CurrentUser() user: IJwtStrategyUser,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    await this.usersService.updateMeta( body.metadata.id, body.metadata, i18n, metadata );
    const profileData = await this.usersService.update( i18n, user.userId, body.data, metadata );

    ObjectUtils.adjustEntityMetaResultByLang( profileData, this.defaultLangLocaleName, i18n.lang );
    return profileData;
  }

  /************************ */
  /* Admin Controllers Area */
  /************************ */

  // Users List
  @Get( 'admin/users' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_READ )
  adminFindAll ( @Query() query: UsersListQueryDto, @I18n() i18n: I18nContext ): Promise<IListResultGenerator<User>> {
    return this.usersService.findAll( query );
  }

  // User Details
  @Get( 'admin/users/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_READ )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<User> {
    return this.usersService.findOne( id, i18n );
  }

  // Add User Meta Info
  @Post( 'admin/users/:userId/add-meta' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_CREATE )
  addMeta (
    @I18n() i18n: I18nContext,
    @Param( 'userId' ) userId: string,
    @Body() body: AdminAddMetaDto,
    @Metadata() metadata: IMetadataDecorator ): Promise<UserMeta> {
    return this.usersService.addMeta( userId, body, i18n, metadata );
  }

  // Edit User
  @Patch( 'admin/users/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_EDIT )
  adminUpdate (
    @I18n() i18n: I18nContext,
    @Param( 'id' ) id: string,
    @Body() body: AdminUpdateUserDto,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.update( i18n, id, body, metadata );
  }

  // Edit User Meta
  @Patch( 'admin/users/update-meta/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_EDIT )
  adminUpdateUserMeta (
    @I18n() i18n: I18nContext,
    @Param( 'id' ) id: string,
    @Body() body: UpdateMetaDto,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<UserMeta> {
    return this.usersService.updateMeta( id, body, i18n, metadata );
  }

  // Edit User Claims
  @Patch( 'admin/users/update-claims/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_EDIT )
  adminUpdateUserClaims (
    @I18n() i18n: I18nContext,
    @Param( 'id' ) id: string,
    @Body() body: UpdateUserClaimsDto,
  ): Promise<User> {
    return this.usersService.updateUserClaims( id, body, i18n );
  }

  // Soft Remove User
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_DELETE )
  @Delete( 'admin/users/soft-delete/:id' )
  adminSoftRemove ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<User> {
    return this.usersService.softRemove( i18n, id );
  }

  // Recover User
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_DELETE )
  @HttpCode( HttpStatus.OK )
  @Patch( 'admin/users/recover/:id' )
  adminRecover ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<User> {
    return this.usersService.recover( i18n, id );
  }

  // Delete User
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_DELETE )
  @Delete( 'admin/users/permanent-delete/:id' )
  adminRemove ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<User> {
    return this.usersService.remove( i18n, id );
  }

  // Claims List
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_READ )
  @Get( 'admin/claims' )
  adminFindAllClaims (): Promise<Claim[]> {
    return this.usersService.findAllClaims();
  }
}
