import { Module } from '@nestjs/common';
import { DataSeederService } from './data-seeder.service';
import { TitlesModule } from '../titles/titles.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { GenresModule } from '../genres/genres.module';
import { TitleGenreModule } from '../title-genre/title-genre.module';
import { RolesModule } from '../roles/roles.module';
import { SettingsModule } from 'src/settings/setting.module';

@Module({
  imports: [
    SettingsModule,
    TitlesModule,
    ChaptersModule,
    GenresModule,
    TitleGenreModule,
    RolesModule,
  ],
  providers: [DataSeederService],
  exports: [DataSeederService],
})
export class DatabaseModule {}
