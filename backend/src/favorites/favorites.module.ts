import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { Favorite } from './entities/favorite.entity';
import { TitlesModule } from 'src/titles/titles.module';
import { UserModule } from 'src/user/user.module';
import { FavoriteRepository } from './favorites.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorite]), // Solo necesita Favorite, ya que TitlesModule proveerá Title y Chapter
    TitlesModule, // <<-- AÑADIDO: Para que TitlesService, TitleRepository y ChapterRepository estén disponibles
    UserModule,
  ],
  controllers: [FavoritesController],
  providers: [
    FavoritesService,
    FavoriteRepository
    // <<-- ELIMINADOS: TitleRepository y ChapterRepository, ahora vienen de TitlesModule
  ],
  exports: [FavoritesService, FavoriteRepository],
})
export class FavoritesModule {}
