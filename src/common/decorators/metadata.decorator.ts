import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Lang } from "src/langs/entities/lang.entity";
import { User } from "src/users/entities/user.entity";

export interface IMetadataDecorator {
  user?: Partial<User>;
  defaultLang?: Partial<Lang>;
  lang: Partial<Lang>;
  ipAddress: string;
  userAgent: string;
}

export const Metadata = createParamDecorator(
  ( data: unknown, ctx: ExecutionContext ) => {
    const request = ctx.switchToHttp().getRequest();
    const metadata: IMetadataDecorator = {
      user: {id: request.user?.userId, email: request.user?.username, claims: request.user?.claims},
      defaultLang: request.defaultLang,
      lang: request.currentLang,
      ipAddress: request.ip,
      userAgent: request.get( 'User-Agent' ) ?? 'unknown'
    };

    return metadata;
  }
);