import { Test, TestingModule } from '@nestjs/testing';
import { TitleGenreService } from './title-genre.service';

describe('TitleGenreService', () => {
  let service: TitleGenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TitleGenreService],
    }).compile();

    service = module.get<TitleGenreService>(TitleGenreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
