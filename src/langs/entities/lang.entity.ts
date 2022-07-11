import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { File } from "src/files/entities/file.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Lang extends BaseMinimalEntity {
  @Column()
  name: string;

  @Column( { unique: true } )
  localeName: string;

  @Column()
  hrefLang: string;

  @Column()
  direction: "ltr" | "rtl";

  @Column( { default: false } )
  selected: boolean;

  @ManyToOne( () => File )
  flag: File;
}
