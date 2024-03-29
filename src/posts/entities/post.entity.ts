import { BaseEntity } from "src/common/entities/base.entity";
import { File } from "src/files/entities/file.entity";
import { Taxonomy } from "src/taxonomies/entities/taxonomy.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne } from "typeorm";
import { PostMeta } from "./post-meta.entity";

export enum PostVisibilityEnum {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE"
}

export enum PostStatusEnum {
  PUBLISH = "PUBLISH",
  FUTURE = "FUTURE",
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  AUTO_DRAFT = "AUTO_DRAFT",
  INHERIT = "INHERIT",
  ARCHIVE = "ARCHIVE"
}

export enum PostTypeEnum {
  BLOG = "BLOG",
  PAGE = "PAGE",
  NEWS = "NEWS",
  BANNER = "BANNER",
  EMAIL_TEMPLATE = "EMAIL_TEMPLATE",
  NEWSLETTER_HEADER_TEMPLATE = "NEWSLETTER_HEADER_TEMPLATE",
  NEWSLETTER_BODY_TEMPLATE = "NEWSLETTER_BODY_TEMPLATE",
  NEWSLETTER_FOOTER_TEMPLATE = "NEWSLETTER_FOOTER_TEMPLATE",
  SMS_TEMPLATE = "SMS_TEMPLATE",
  SMS_BIRTHDAY_TEMPLATE = "SMS_BIRTHDAY_TEMPLATE"
}

@Entity()
export class Post extends BaseEntity {
  @Column()
  visibility: PostVisibilityEnum;

  @Column()
  status: PostStatusEnum;

  @Column( { nullable: true } )
  scheduledToPublish?: Date;

  @Column( { nullable: true } )
  scheduledToArchive?: Date;

  @Column( { default: false } )
  commentAllowed?: Boolean;

  @Column( { default: 0 } )
  viewCount?: number;

  @Column()
  type: PostTypeEnum;

  @Column( { default: false } )
  isPinned?: Boolean;

  @Column( { default: 0 } )
  order?: number;

  @OneToOne( () => Post, ( post ) => post.parent )
  child: Post;

  @OneToOne( () => Post, ( post ) => post.child )
  @JoinColumn()
  parent: Post;

  @ManyToMany( () => Taxonomy )
  @JoinTable( { name: 'posts_taxonomies' } )
  taxonomies: Taxonomy[];

  @ManyToMany( () => File )
  @JoinTable( { name: 'posts_files' } )
  attachments: File[];

  @ManyToMany( () => User )
  @JoinTable( { name: 'posts_likes' } )
  likes: User[];

  @Column( { default: 0 } )
  likesNum: number;

  @ManyToMany( () => User, ( user ) => user.bookmarks )
  bookmarks: User[];

  @Column( { default: 0 } )
  bookmarksNum: number;

  @OneToMany( () => PostMeta, ( meta ) => meta.post, { cascade: true } )
  meta: PostMeta[];
}
