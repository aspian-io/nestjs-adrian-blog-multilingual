import { Expose, Transform } from "class-transformer";

export class LoginRegisterDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  gender: string;

  @Expose()
  country?: string;

  @Expose()
  state?: string;

  @Expose()
  city?: string;

  @Expose()
  @Transform( ( { obj } ) => obj.meta[ 0 ].firstName )
  firstName: string;

  @Expose()
  @Transform( ( { obj } ) => obj.meta[ 0 ].lastName )
  lastName: string;

  @Expose()
  accessToken: string;
}