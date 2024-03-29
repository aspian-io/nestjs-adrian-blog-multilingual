import { Expose } from "class-transformer";
import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Post } from "src/posts/entities/post.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Claim } from "./claim.entity";
import { UserMeta } from "./user-meta.entity";

export enum GenderEnum {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other"
}

@Entity()
export class User extends BaseMinimalEntity {
  @Column( { unique: true } )
  email: string;

  @Column()
  password: string;

  @Column( { nullable: true } )
  birthDate: Date;

  @Column( { nullable: true } )
  gender: GenderEnum;

  @Column( { nullable: true } )
  country: string;

  @Column( { nullable: true } )
  state: string;

  @Column( { nullable: true } )
  city: string;

  @Column( { nullable: true } )
  address: string;

  @Column( { nullable: true } )
  phone: string;

  @Column( { unique: true, nullable: true } )
  mobilePhone: string;

  @Column( { nullable: true } )
  postalCode: string;

  @Column( { nullable: true } )
  suspend: Date | null;

  @ManyToMany( () => Claim, { cascade: true } )
  @JoinTable( { name: "users_claims" } )
  claims: Claim[];

  @OneToMany(
    () => UserMeta,
    ( meta ) => meta.user,
    { cascade: true }
  )
  meta: UserMeta[];

  @Column( { default: 1 } )
  metaNum: number;

  @ManyToMany( () => Post, ( post ) => post.bookmarks, { cascade: true } )
  @JoinTable( {
    name: 'users_posts_bookmarks'
  } )
  bookmarks: Post[];
}
