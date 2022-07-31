import { BaseEntity } from "src/common/entities/base.entity";
import { File } from "src/files/entities/file.entity";
import { Lang } from "src/langs/entities/lang.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Post } from "./post.entity";

@Entity()
export class PostMeta extends BaseEntity {
  @ManyToOne( () => Lang, { eager: true, nullable: false } )
  lang: Lang;

  @Column()
  title: string;

  @Column( { nullable: true } )
  subtitle?: string;

  @Column( { nullable: true } )
  content?: string;

  @Column()
  slug: string;

  @ManyToOne( () => File )
  featuredImage?: File;

  @ManyToOne( () => Post, ( post ) => post.meta, { onDelete: "CASCADE" } )
  post: Post;
}