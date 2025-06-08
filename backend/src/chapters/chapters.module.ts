import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { Chapter } from './entities/chapter.entity';
import { Title } from 'src/titles/entities/title.entity'; // Importar
import { ChapterRepository } from './chapters.repository';
import { TitleRepository } from 'src/titles/titles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Title])], // Añadir Title para usar TitleRepository
  controllers: [ChaptersController],
  providers: [ChaptersService, ChapterRepository, TitleRepository],
  exports: [ChaptersService, ChapterRepository], // Exportar si otros módulos necesitan
})
export class ChaptersModule {}
