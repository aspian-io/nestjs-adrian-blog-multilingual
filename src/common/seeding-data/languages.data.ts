import { Lang } from "src/langs/entities/lang.entity";

export const languageData: Partial<Lang>[] = [
  {
    name: "English",
    localeName: "en",
    hrefLang: "en",
    selected: true,
    direction: "ltr",
    userAgent: "SYSTEM"
  },
  {
    name: "فارسی",
    localeName: "fa",
    hrefLang: "fa",
    selected: true,
    direction: "rtl",
    userAgent: "SYSTEM"
  },
  {
    name: "العربية",
    localeName: "ar",
    hrefLang: "ar",
    selected: false,
    direction: "ltr",
    userAgent: "SYSTEM"
  },
];