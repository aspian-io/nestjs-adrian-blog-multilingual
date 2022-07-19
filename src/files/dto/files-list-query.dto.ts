import { Expose, Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { ISortValues, QueryStringUtils } from "src/common/utils/query-string.utils";
import { FilePolicyEnum, FileSectionEnum, FileStatus, ImageSizeCategories } from "../entities/file.entity";

export class FilesListQueryDto {

  @Transform( ( { value } ) => QueryStringUtils.extractSearchString( value ) )
  @IsOptional()
  search?: string;

  @Transform( ( { value } ) => QueryStringUtils.extractValuesListBasedOn( value, Object.values( FilePolicyEnum ) ) )
  @IsOptional()
  "filterBy.policy"?: FilePolicyEnum[];

  @Transform( ( { value } ) => QueryStringUtils.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.type"?: string[];

  @Transform( ( { value } ) => QueryStringUtils.extractCommaSeparatedNumberRange( value ) )
  @IsOptional()
  "filterBy.size"?: number[];

  @Transform( ( { value } ) => QueryStringUtils.extractValuesListBasedOn( value, Object.values( FileStatus ) ) )
  @IsOptional()
  "filterBy.status"?: FileStatus[];

  @Transform( ( { value } ) => QueryStringUtils.extractValuesListBasedOn( value, Object.values( FileSectionEnum ) ) )
  @IsOptional()
  "filterBy.section"?: FileSectionEnum[];

  @Transform( ( { value } ) => QueryStringUtils.extractValuesListBasedOn( value, Object.values( ImageSizeCategories ) ) )
  @IsOptional()
  "filterBy.imageSizeCategory"?: ImageSizeCategories[];

  @IsOptional()
  "filterBy.createdBy"?: string;

  @IsOptional()
  "filterBy.updatedBy"?: string;

  @Transform( ( { value } ) => QueryStringUtils.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.createdAt"?: string[];

  @Transform( ( { value } ) => QueryStringUtils.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.updatedAt"?: string[];

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
const defaultSort = [ 'file.createdAt', 'DESC' ];
// Sort Fields
const sortFields = [
  'file.key',
  'file.filename',
  'file.policy',
  'file.type',
  'file.size',
  'file.status',
  'file.section',
  'file.createdAt',
  'file.updatedAt',
  'file.createdBy',
  'file.updatedBy'
];