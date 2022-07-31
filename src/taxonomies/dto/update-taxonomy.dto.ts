import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { CreateTaxonomyMetaDto } from './create-taxonomy-meta.dto';

export class UpdateTaxonomyMetaDto extends PartialType( CreateTaxonomyMetaDto ) {
  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  @IsOptional()
  id?: string;
}

export class UpdateTaxonomyDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  href?: string;

  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  @IsOptional()
  parentId?: string;

  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @IsOptional()
  order?: number;

  @ValidateNested()
  @Type( () => UpdateTaxonomyMetaDto )
  @ArrayMinSize( 1, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_ARRAY_MIN_LENGTH ) } )
  meta: UpdateTaxonomyMetaDto[];
}
