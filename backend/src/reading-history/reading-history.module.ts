import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingHistoryService } from './reading-history.service';
import { ReadingHistoryController } from './reading-history.controller';
import { ReadingHistory } from './entities/reading-history.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { Title } from 'src/titles/entities/title.entity'; // Importar Title
import { ReadingHistoryRepository } from './reading-history.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { TitleRepository } from 'src/titles/titles.repository'; // Importar TitleRepository

@Module({
  imports: [
    TypeOrmModule.forFeature([ReadingHistory, Chapter, Title]), // Añadir Title
  ],
  controllers: [ReadingHistoryController],
  providers: [
    ReadingHistoryService,
    ReadingHistoryRepository,
    ChapterRepository,
    TitleRepository, // Añadir TitleRepository
  ],
  exports: [ReadingHistoryService, ReadingHistoryRepository],
})
export class ReadingHistoryModule {}
