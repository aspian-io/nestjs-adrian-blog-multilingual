import { Expose, Type } from "class-transformer";
import { TaxonomyMetaDto } from "./taxonomy-meta.dto";

export class TaxonomyDto {
  @Expose()
  href: string;

  @Expose()
  order?: number;

  @Expose()
  @Type( () => TaxonomyDto )
  parent?: TaxonomyDto;

  @Expose()
  @Type( () => TaxonomyDto )
  children?: TaxonomyDto[];

  @Expose()
  @Type( () => TaxonomyMetaDto )
  meta: TaxonomyMetaDto;
}