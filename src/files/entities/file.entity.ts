import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

export enum AttachmentPolicyEnum {
  DOWNLOAD = "DOWNLOAD",
  PRIVATE = "PRIVATE"
}

export enum AttachmentSectionEnum {
  SITE_LOGO = "SITE_LOGO",
  MAIN_SLIDESHOW = "MAIN_SLIDESHOW",
  USER = "USER",
  BLOG = "BLOG",
  NEWS = "NEWS",
  BRAND_LOGO = "BRAND_LOGO",
  PRODUCT = "PRODUCT",
  COURSE = "COURSE"
}

@Entity()
export class File extends BaseEntity {
  @Column()
  path: string;

  @Column()
  policy: AttachmentPolicyEnum;

  @Column()
  filename: string;

  @Column()
  type: string;

  @Column()
  caption: string;

  @Column()
  size: number;

  @Column()
  section: AttachmentSectionEnum;
}
