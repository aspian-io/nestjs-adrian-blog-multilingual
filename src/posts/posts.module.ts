import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostMeta } from './entities/post-meta.entity';
import { BullModule } from '@nestjs/bull';
import { PostQueues } from './queues/queues.enum';
import { ScheduledPostJobConsumer } from './queues/consumers/scheduled-post.consumer';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ Post, PostMeta ] ),
    BullModule.registerQueue( { name: PostQueues.SCHEDULED_POSTS } ),
  ],
  controllers: [ PostsController ],
  providers: [ PostsService, ScheduledPostJobConsumer ]
} )
export class PostsModule { }
