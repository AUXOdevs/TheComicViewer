import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitlesService } from './titles.service';
import { TitlesController } from './titles.controller';
import { Title } from './entities/title.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity'; // Importar
import { TitleRepository } from './titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Title, Chapter])],
  controllers: [TitlesController],
  providers: [TitlesService, TitleRepository, ChapterRepository],
  exports: [TitlesService, TitleRepository, ChapterRepository],
})
export class TitlesModule {}
