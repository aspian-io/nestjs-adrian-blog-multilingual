import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { PermissionsEnum } from "src/common/security/permissions.enum";
import { ISortValues, QueryStringUtils } from "src/common/utils/query-string.utils";

export class UsersListQueryDto {
  @Transform( ( { value } ) => QueryStringUtils.extractSearchString( value ) )
  @IsOptional()
  search?: string;

  @Transform( ( { value } ) => QueryStringUtils.extractValuesListBasedOn( value, Object.values( PermissionsEnum ) ) )
  @IsOptional()
  "filterBy.claims"?: string[];

  @Transform( ( { value } ) => QueryStringUtils.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.lang"?: string[];

  @Transform( ( { value } ) => QueryStringUtils.toBoolean( value ) )
  @IsOptional()
  "filterBy.suspended"?: boolean;

  @Transform(
    ( { value } ) => QueryStringUtils.extractColonSeparatedSortParams( defaultSort, sortFields, value )
  )
  @IsOptional()
  orderBy?: ISortValues = {
    sortField: defaultSort[ 0 ],
    sortMethod: defaultSort[ 1 ] as 'ASC' | 'DESC'
  };

  @Transform( ( { value } ) => QueryStringUtils.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtils.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}

// Default Sort
const defaultSort = [ 'user.createdAt', 'DESC' ];

// Sort fields
const sortFields = [
  'user.email',
  'user.birthDate',
  'user.country',
  'user.state',
  'user.city',
  'user.address',
  'user.phone',
  'user.mobilePhone',
  'user.postalCode',
  'user.createdAt',
  'user.updatedAt',
  'user.suspend',
  'user.ipAddress',
  'user.userAgent',
  'user_meta.firstName',
  'user_meta.lastName',
  'user_meta.bio',
  'user_meta.createdAt',
  'user_meta.updatedAt',
  'user_meta.ipAddress',
  'user_meta.userAgent',
];