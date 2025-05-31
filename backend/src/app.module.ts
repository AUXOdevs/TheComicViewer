import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { RolesModule } from './roles/roles.module';
import { TitlesModule } from './titles/titles.module';
import { ChaptersModule } from './chapters/chapters.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CommentsModule } from './comments/comments.module';
import { RatingsModule } from './ratings/ratings.module';
import { AdminsModule } from './admins/admins.module';
import { GenresModule } from './genres/genres.module';
import { TitleGenreModule } from './title-genre/title-genre.module';
import { ReadingHistoryModule } from './reading-history/reading-history.module';

@Module({
  imports: [UserModule, RolesModule, TitlesModule, ChaptersModule, FavoritesModule, CommentsModule, RatingsModule, AdminsModule, GenresModule, TitleGenreModule, ReadingHistoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
