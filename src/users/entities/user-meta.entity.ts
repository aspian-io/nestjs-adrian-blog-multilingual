import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Lang } from "src/langs/entities/lang.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserMeta extends BaseMinimalEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column( { nullable: true } )
  bio: string;

  @ManyToOne( () => Lang, { eager: true } )
  lang: Lang;

  @ManyToOne( () => User, ( user ) => user.meta, { onDelete: "CASCADE" } )
  user: User;
}