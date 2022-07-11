import { IntersectionType, OmitType, PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { UserDataCreateDto, UserMetaCreateDto } from "./create-user.dto";

class ExtraMetaDataProps {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  id: string;
}

class UpdateUserDataDto extends PartialType( OmitType( UserDataCreateDto, ['email', 'password'] ) ) { }
class UpdateUserMetadataDto extends PartialType( IntersectionType( UserMetaCreateDto, ExtraMetaDataProps ) ) { }

export class UpdateUserDto {
  @ValidateNested()
  @Type( () => UpdateUserDataDto )
  data: UpdateUserDataDto;

  @ValidateNested()
  @Type( () => UpdateUserMetadataDto )
  metadata: UpdateUserMetadataDto[];
}