import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString } from "class-validator";
import { Lang } from "src/langs/entities/lang.entity";
import { UserMetaCreateDto } from "./create-user.dto";

export class AddMetaDto extends PartialType( UserMetaCreateDto ) {
  @IsString()
  @IsNotEmpty()
  langId: string;
}