import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingHistoryService } from './reading-history.service';
import { ReadingHistoryController } from './reading-history.controller';
import { ReadingHistory } from './entities/reading-history.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity'; // Importar
import { ReadingHistoryRepository } from './reading-history.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReadingHistory, Chapter]), // Añadir Chapter
  ],
  controllers: [ReadingHistoryController],
  providers: [
    ReadingHistoryService,
    ReadingHistoryRepository,
    ChapterRepository,
  ],
  exports: [ReadingHistoryService, ReadingHistoryRepository],
})
export class ReadingHistoryModule {}
