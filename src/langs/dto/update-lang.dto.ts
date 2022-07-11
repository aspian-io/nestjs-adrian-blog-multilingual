import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { CreateLangDto } from './create-lang.dto';

class ExtraLangUpdateDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  id: string;
}

export class UpdateLangDto extends PartialType( IntersectionType( CreateLangDto, ExtraLangUpdateDto ) ) { }
