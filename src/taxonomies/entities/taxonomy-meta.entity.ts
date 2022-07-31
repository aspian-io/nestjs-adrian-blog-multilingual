import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { File } from "src/files/entities/file.entity";
import { Lang } from "src/langs/entities/lang.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Taxonomy } from "./taxonomy.entity";

@Entity()
export class TaxonomyMeta extends BaseMinimalEntity {
  @Column( { nullable: true } )
  description?: string;

  @Column()
  term: string;

  @Column()
  slug: string;

  @ManyToOne( () => File )
  featuredImage?: File;

  @ManyToOne( () => Taxonomy, ( taxonomy ) => taxonomy.meta, { onDelete: 'CASCADE' } )
  taxonomy: Taxonomy;

  @ManyToOne( () => Lang, { eager: true, nullable: false } )
  lang: Lang;
}