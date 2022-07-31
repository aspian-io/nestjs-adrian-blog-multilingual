import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { TaxonomyMeta } from "./taxonomy-meta.entity";

export enum TaxonomyTypeEnum {
  MENU = "MENU",
  MENU_ITEM = "MENU_ITEM",
  CATEGORY = "CATEGORY",
  TAG = "TAG"
}

@Entity()
export class Taxonomy extends BaseMinimalEntity {
  @Column( { enum: TaxonomyTypeEnum } )
  type: TaxonomyTypeEnum;

  @Column( { default: '/' } )
  href: string;

  @Column( { default: 0 } )
  order?: number;

  @ManyToOne( () => Taxonomy, ( taxonomy ) => taxonomy.children )
  parent?: Taxonomy;

  @OneToMany( () => Taxonomy, ( taxonomy ) => taxonomy.parent )
  children?: Taxonomy[];

  @OneToMany( () => TaxonomyMeta, ( meta ) => meta.taxonomy, { cascade: true } )
  meta: TaxonomyMeta[];
}
