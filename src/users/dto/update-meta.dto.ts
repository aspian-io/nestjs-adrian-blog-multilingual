import { PartialType } from "@nestjs/mapped-types";
import { UserMetaCreateDto } from "./create-user.dto";

export class UpdateMetaDto extends PartialType( UserMetaCreateDto ) { }