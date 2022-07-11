import { Expose } from "class-transformer";

export class LangDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  localeName: string;

  @Expose()
  hrefLang: string;

  @Expose()
  direction: "ltr" | "rtl";

  @Expose()
  selected: boolean;

  @Expose()
  flagId: string;
}