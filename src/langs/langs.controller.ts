import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LangsService } from './langs.service';
import { CreateLangDto } from './dto/create-lang.dto';
import { UpdateLangDto } from './dto/update-lang.dto';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Lang } from './entities/lang.entity';

@Controller()
export class LangsController {
  constructor ( private readonly langsService: LangsService ) { }

  // Create a New Language
  @Post('admin/langs')
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.LANG_CREATE )
  create ( @Body() createLangDto: CreateLangDto, @Metadata() metadata: IMetadataDecorator ) {
    return this.langsService.create( createLangDto, metadata );
  }

  // Get All Languages
  @Get('admin/langs')
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.LANG_READ )
  findAll () {
    return this.langsService.findAll();
  }
  
  // Find one Language
  @Get( 'admin/langs/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.LANG_READ )
  findOne ( @Param( 'id' ) id: string ) {
    return this.langsService.findOne( id );
  }

  // Update a Language
  @Patch( 'admin/langs/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.LANG_EDIT )
  update (
    @Param( 'id' ) id: string,
    @Body() updateLangDto: UpdateLangDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ) {
    return this.langsService.update( id, updateLangDto, i18n, metadata );
  }

  // Soft Remove Language
  @Delete( 'admin/langs/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.LANG_DELETE )
  softRemove ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<Lang> {
    return this.langsService.softRemove( i18n, id );
  }

  // Recover Language
  @Patch( 'admin/langs/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.LANG_DELETE )
  recover ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<Lang> {
    return this.langsService.recover( i18n, id );
  }

  // Permanent Delete
  @Delete( 'admin/langs/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.LANG_DELETE )
  remove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.langsService.remove( id, i18n );
  }
}
