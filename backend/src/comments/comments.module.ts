import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { Title } from 'src/titles/entities/title.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { CommentRepository } from './comments.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Title, Chapter])],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentRepository,
    TitleRepository,
    ChapterRepository,
  ],
  exports: [CommentsService, CommentRepository],
})
export class CommentsModule {}
