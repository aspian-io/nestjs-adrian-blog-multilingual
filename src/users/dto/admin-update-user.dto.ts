import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsDateString, IsOptional } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { UserDataCreateDto } from "./create-user.dto";

export class AdminUpdateUserDto extends PartialType( UserDataCreateDto ) {
  @IsDateString( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @IsOptional()
  suspend?: Date;
}