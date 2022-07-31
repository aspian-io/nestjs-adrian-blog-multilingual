import { Expose, Type } from "class-transformer";
import { FileDto } from "src/files/dto/file.dto";
import { LangDto } from "src/langs/dto/lang.dto";

export class TaxonomyMetaDto {
  @Expose()
  term: string;

  @Expose()
  description?: string;

  @Expose()
  slug: string;

  @Expose()
  @Type( () => FileDto )
  featuredImage?: FileDto;

  @Expose()
  @Type( () => LangDto )
  lang: LangDto;
}