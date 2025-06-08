import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { Favorite } from './entities/favorite.entity';
import { Title } from 'src/titles/entities/title.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { FavoriteRepository } from './favorites.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorite, Title, Chapter]), // Añadir Title y Chapter
  ],
  controllers: [FavoritesController],
  providers: [
    FavoritesService,
    FavoriteRepository,
    TitleRepository,
    ChapterRepository,
  ],
  exports: [FavoritesService, FavoriteRepository],
})
export class FavoritesModule {}
