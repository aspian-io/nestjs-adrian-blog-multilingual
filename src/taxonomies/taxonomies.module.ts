import { Module } from '@nestjs/common';
import { TaxonomiesService } from './taxonomies.service';
import { TaxonomiesController } from './taxonomies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taxonomy } from './entities/taxonomy.entity';
import { TaxonomyMeta } from './entities/taxonomy-meta.entity';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ Taxonomy, TaxonomyMeta ] ),
  ],
  controllers: [ TaxonomiesController ],
  providers: [ TaxonomiesService ],
} )
export class TaxonomiesModule { }
