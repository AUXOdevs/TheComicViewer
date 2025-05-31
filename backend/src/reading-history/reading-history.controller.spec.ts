import { Test, TestingModule } from '@nestjs/testing';
import { ReadingHistoryController } from './reading-history.controller';
import { ReadingHistoryService } from './reading-history.service';

describe('ReadingHistoryController', () => {
  let controller: ReadingHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadingHistoryController],
      providers: [ReadingHistoryService],
    }).compile();

    controller = module.get<ReadingHistoryController>(ReadingHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
