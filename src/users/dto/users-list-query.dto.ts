import { IsOptional } from "class-validator";

export class UsersListQueryDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  "filterBy.claims"?: string;

  @IsOptional()
  "filterBy.lang"?: string;

  @IsOptional()
  "filterBy.suspended"?: string;

  @IsOptional()
  orderBy?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit: number;
}