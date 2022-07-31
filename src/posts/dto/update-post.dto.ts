import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDate, IsIn, IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { PostStatusEnum, PostTypeEnum, PostVisibilityEnum } from '../entities/post.entity';
import { CreatePostMetaDto } from './create-post-meta.dto';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostMetaDto extends PartialType( CreatePostMetaDto ) {
  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  @IsOptional()
  id?: string;
}

export class UpdatePostDto {
  @IsIn( Object.values( PostVisibilityEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  visibility: PostVisibilityEnum;

  @IsIn( Object.values( PostStatusEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  status: PostStatusEnum;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @Type( () => Date )
  @IsOptional()
  scheduledToPublish?: Date;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @Type( () => Date )
  @IsOptional()
  scheduledToArchive?: Date;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  commentAllowed?: Boolean;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  isPinned?: Boolean;

  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @IsOptional()
  order?: number;

  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  @IsOptional()
  parentId?: string;

  @IsArray( { message: CommonErrorsLocale.VALIDATOR_IS_ARRAY } )
  @IsOptional()
  taxonomiesIds?: string[];

  @IsArray( { message: CommonErrorsLocale.VALIDATOR_IS_ARRAY } )
  @IsOptional()
  attachmentsIds?: string[];

  @ValidateNested()
  @Type( () => UpdatePostMetaDto )
  @ArrayMinSize( 1, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_ARRAY_MIN_LENGTH ) } )
  meta: UpdatePostMetaDto[];
}
