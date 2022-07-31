import { Expose, Transform } from "class-transformer";
import { GenderEnum } from "../entities/user.entity";

export class UserDto {
  @Expose()
  accessToken: string;

  @Expose()
  @Transform( ( { obj } ) => obj.meta[ 0 ].firstName )
  firstName: string;

  @Expose()
  @Transform( ( { obj } ) => obj.meta[ 0 ].lastName )
  lastName: string;

  @Expose()
  @Transform( ( { obj } ) => obj.meta[ 0 ]?.bio )
  bio: string;

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
}