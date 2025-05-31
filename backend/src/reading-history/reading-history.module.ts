import { Module } from '@nestjs/common';
import { ReadingHistoryService } from './reading-history.service';
import { ReadingHistoryController } from './reading-history.controller';

@Module({
  controllers: [ReadingHistoryController],
  providers: [ReadingHistoryService],
})
export class ReadingHistoryModule {}
