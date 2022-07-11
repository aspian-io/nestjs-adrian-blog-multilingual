import { Lang } from "src/langs/entities/lang.entity";

declare global {
  namespace Express {
    interface Request {
      defaultLang?: Lang;
      currentLang?: Lang;
    }
  }
}