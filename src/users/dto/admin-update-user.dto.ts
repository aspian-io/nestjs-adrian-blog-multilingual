import { IntersectionType, PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { UserDataCreateDto, UserMetaCreateDto } from "./create-user.dto";

class ExtraDataProps {
  @IsArray( { message: CommonErrorsLocale.VALIDATOR_IS_ARRAY } )
  @IsOptional()
  claims: string[];

  @IsDateString( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @IsOptional()
  suspend?: Date;
}

class ExtraMetaDataProps {

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  id: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  langId: string;
}

class AdminUpdateUserDataDto extends PartialType( IntersectionType( UserDataCreateDto, ExtraDataProps ) ) { }
class AdminUpdateUserMetadataDto extends PartialType( IntersectionType( UserMetaCreateDto, ExtraMetaDataProps ) ) { }

export class AdminUpdateUserDto {
  @ValidateNested()
  @Type( () => AdminUpdateUserDataDto )
  data: AdminUpdateUserDataDto;


  @ValidateNested()
  @Type( () => AdminUpdateUserMetadataDto )
  metadata: AdminUpdateUserMetadataDto[];
}