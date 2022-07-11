import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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
  suspend: Date;

  @ManyToMany( () => Claim, { cascade: true } )
  @JoinTable( { name: "users_claims" } )
  claims: Claim[];

  @OneToMany(
    () => UserMeta,
    ( userMeta ) => userMeta.user,
    { cascade: true }
  )
  meta: UserMeta[];
}
