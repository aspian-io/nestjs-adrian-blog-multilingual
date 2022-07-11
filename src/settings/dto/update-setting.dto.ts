import { IsNotEmpty } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class UpdateSettingDto {
  @IsNotEmpty({ message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY })
  value: string;
}
