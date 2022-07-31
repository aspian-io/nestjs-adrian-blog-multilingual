import { Expose, Type } from "class-transformer";
import { GenderEnum } from "src/users/entities/user.entity";

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
  firstName: string;

  @Expose()
  bio: string;

  @Expose()
  lastName: string;

  @Expose()
  @Type( () => UserLangDto )
  lang: UserLangDto;
}

export class MinimalUserDto {
  @Expose()
  email: string;

  @Expose()
  gender: GenderEnum;

  @Expose()
  @Type( () => UserMetaDto )
  meta: UserMetaDto[];
}