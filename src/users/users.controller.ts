import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { UserDto } from './dto/user.dto';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { Response } from 'express';
import { Tokens } from './types/services.type';
import { ConfigService } from '@nestjs/config';
import { UserLoginDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { IJwtStrategyUser, IRtStrategyUser } from './strategies/types';
import { RtAuthGuard } from './guards/rt.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { PermissionsGuard } from './guards/require-permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { User } from './entities/user.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { IControllerUserLoginResult, IControllerUserRefreshTokensResult, IControllerUserRegisterResult } from './types/controllers.type';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Claim } from './entities/claim.entity';
import { AddMetaDto } from './dto/add-meta.dto';
import { UserMeta } from './entities/user-meta.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersListQueryDto } from './dto/users-list-query.dto';

@Controller()
export class UsersController {
  constructor (
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  /************************ */
  /* Users Controllers Area */
  /************************ */

  // Login
  @Post( 'users/login' )
  @HttpCode( HttpStatus.OK )
  @Serialize( UserDto )
  async login (
    @I18n() i18n: I18nContext,
    @Body() userLoginDto: UserLoginDto,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserLoginResult> {
    const user = await this.usersService.loginLocal( i18n, userLoginDto );
    const decodedRt = this.jwtService.decode( user.meta.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.meta.refreshToken,
      {
        signed: true,
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( 'NODE_ENV' ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...user.data, accessToken: user.meta.accessToken };
  }

  // Register
  @Post( 'users/register' )
  @Serialize( UserDto )
  async register (
    @I18n() i18n: I18nContext,
    @Body() createUserDto: CreateUserDto,
    @Metadata() metadata: IMetadataDecorator,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserRegisterResult> {
    const user = await this.usersService.registerLocal( i18n, createUserDto, metadata );
    const decodedRt = this.jwtService.decode( user.meta.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.meta.refreshToken,
      {
        signed: true,
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( 'NODE_ENV' ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...user.data, accessToken: user.meta.accessToken };
  }

  // Refresh Tokens
  @UseGuards( RtAuthGuard )
  @Get( 'users/refresh-tokens' )
  @Serialize( UserDto )
  async refreshTokens (
    @CurrentUser() user: IRtStrategyUser,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserRefreshTokensResult> {
    const result = await this.usersService.refreshTokens( user.refreshToken );
    const decodedRt = this.jwtService.decode( result.meta.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      result.meta.refreshToken,
      {
        signed: true,
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( 'NODE_ENV' ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...result.data, accessToken: result.meta.accessToken };
  }

  // Logout
  @Get( 'users/logout' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  logout ( @Res( { passthrough: true } ) res: Response ): {} {
    res.clearCookie( Tokens.REFRESH_TOKEN );
    return {};
  }

  // View Profile
  @Get( 'users/profile' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  viewProfile ( @CurrentUser() user: IJwtStrategyUser, @I18n() i18n: I18nContext ): Promise<User> {
    return this.usersService.findOne( user.userId, i18n );
  }

  // Edit Profile
  @Post( 'users/profile' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  editProfile (
    @Body() body: UpdateUserDto,
    @CurrentUser() user: IJwtStrategyUser,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.update( i18n, user.userId, body, metadata );
  }

  /************************ */
  /* Admin Controllers Area */
  /************************ */

  // Users List
  @Get( 'admin/users' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_READ )
  async adminFindAll ( @Query() query: UsersListQueryDto ) {
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
    @Body() body: AddMetaDto,
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
