import { Test, TestingModule } from '@nestjs/testing';
import { ReadingHistoryService } from './reading-history.service';

describe('ReadingHistoryService', () => {
  let service: ReadingHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadingHistoryService],
    }).compile();

    service = module.get<ReadingHistoryService>(ReadingHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
