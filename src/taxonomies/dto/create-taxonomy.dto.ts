import { Type } from "class-transformer";
import { ArrayMinSize, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { TaxonomyTypeEnum } from "../entities/taxonomy.entity";
import { CreateTaxonomyMetaDto } from "./create-taxonomy-meta.dto";

export class CreateTaxonomyDto {
  @IsIn( Object.values( TaxonomyTypeEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  type: TaxonomyTypeEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  href?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  parentId?: string;

  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @IsOptional()
  order?: number;

  @ValidateNested()
  @Type( () => CreateTaxonomyMetaDto )
  @ArrayMinSize( 1, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_ARRAY_MIN_LENGTH ) } )
  meta: CreateTaxonomyMetaDto[];
}
