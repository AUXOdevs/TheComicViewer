import { Module } from '@nestjs/common';
import { TitleGenreService } from './title-genre.service';
import { TitleGenreController } from './title-genre.controller';

@Module({
  controllers: [TitleGenreController],
  providers: [TitleGenreService],
})
export class TitleGenreModule {}
