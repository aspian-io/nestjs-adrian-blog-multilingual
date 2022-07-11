import { Expose, Type } from "class-transformer";
import { GenderEnum } from "../entities/user.entity";

class UserLangDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  localeName: string;

  @Expose()
  hrefLang: string;
}

class UserMetaDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  bio: string;

  @Expose()
  lastName: string;

  @Expose()
  @Type( () => UserLangDto )
  lang: UserLangDto;
}

export class UserDto {
  @Expose()
  accessToken: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  birthDate: Date;

  @Expose()
  gender: GenderEnum;

  @Expose()
  country: string;

  @Expose()
  state: string;

  @Expose()
  city: string;

  @Expose()
  address: string;

  @Expose()
  phone: string;

  @Expose()
  mobilePhone: string;

  @Expose()
  postalCode: string;

  @Expose()
  @Type( () => UserMetaDto )
  meta: UserMetaDto[];
}