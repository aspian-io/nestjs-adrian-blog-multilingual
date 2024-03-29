import { Type } from "class-transformer";
import { IsDate, IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsOptional, IsPhoneNumber, IsPostalCode, IsString, Matches, MaxLength, MinLength, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { GenderEnum } from "src/users/entities/user.entity";

export class UserDataCreateDto {
  @IsEmail( {}, { message: CommonErrorsLocale.VALIDATOR_IS_EMAIL } )
  email: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 6, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @Matches( /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: CommonErrorsLocale.VALIDATOR_WEAK_PASSWORD } )
  password: string;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @IsOptional()
  birthDate: Date;

  @IsIn( Object.values( GenderEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsOptional()
  gender: GenderEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 2, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  country: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 2, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  state: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 2, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  city: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 10, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 100, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  address: string;

  @IsPhoneNumber( null, { message: CommonErrorsLocale.VALIDATOR_IS_PHONE_NUMBER } )
  @IsOptional()
  phone: string;

  @IsMobilePhone( null, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE } )
  @IsOptional()
  mobilePhone: string;

  @IsPostalCode( 'any', { message: CommonErrorsLocale.VALIDATOR_IS_POSTAL_CODE } )
  @IsOptional()
  postalCode: string;
}

export class UserMetaCreateDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 2, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  firstName: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 2, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  lastName: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 5, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @IsOptional()
  bio: string;
}


export class AdminCreateUserDto {

  @ValidateNested()
  @Type( () => UserDataCreateDto )
  data: UserDataCreateDto;


  @ValidateNested()
  @Type( () => UserMetaCreateDto )
  metadata: UserMetaCreateDto;
}

