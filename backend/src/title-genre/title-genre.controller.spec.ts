import { Test, TestingModule } from '@nestjs/testing';
import { TitleGenreController } from './title-genre.controller';
import { TitleGenreService } from './title-genre.service';

describe('TitleGenreController', () => {
  let controller: TitleGenreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TitleGenreController],
      providers: [TitleGenreService],
    }).compile();

    controller = module.get<TitleGenreController>(TitleGenreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
