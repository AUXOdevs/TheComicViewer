import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleGenreService } from './title-genre.service';
import { TitleGenreController } from './title-genre.controller';
import { TitleGenre } from './entities/title-genre.entity';
import { Title } from 'src/titles/entities/title.entity'; // Importar
import { Genre } from 'src/genres/entities/genre.entity'; // Importar
import { TitleGenreRepository } from './title-genre.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { GenreRepository } from 'src/genres/genres.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TitleGenre, Title, Genre]), // Añadir Title y Genre
  ],
  controllers: [TitleGenreController],
  providers: [
    TitleGenreService,
    TitleGenreRepository,
    TitleRepository,
    GenreRepository,
  ],
  exports: [TitleGenreService, TitleGenreRepository],
})
export class TitleGenreModule {}
