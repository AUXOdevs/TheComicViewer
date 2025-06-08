import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Rating } from './entities/rating.entity';
import { Title } from 'src/titles/entities/title.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { RatingRepository } from './ratings.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Title, Chapter]), // Añadir Title y Chapter
  ],
  controllers: [RatingsController],
  providers: [
    RatingsService,
    RatingRepository,
    TitleRepository,
    ChapterRepository,
  ],
  exports: [RatingsService, RatingRepository],
})
export class RatingsModule {}
