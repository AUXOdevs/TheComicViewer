import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TitleGenre } from './entities/title-genre.entity';

@Injectable()
export class TitleGenreRepository {
  constructor(
    @InjectRepository(TitleGenre)
    private readonly titleGenreORMRepository: Repository<TitleGenre>,
  ) {}

  private createQueryBuilder(alias = 'titleGenre') {
    return this.titleGenreORMRepository.createQueryBuilder(alias);
  }

  async findByTitleId(titleId: string): Promise<TitleGenre[]> {
    return this.createQueryBuilder('titleGenre')
      .leftJoinAndSelect('titleGenre.genre', 'genre')
      .where('titleGenre.title_id = :titleId', { titleId })
      .getMany();
  }

  async findOneByTitleAndGenre(
    titleId: string,
    genreId: string,
  ): Promise<TitleGenre | null> {
    return this.createQueryBuilder('titleGenre')
      .where('titleGenre.title_id = :titleId', { titleId })
      .andWhere('titleGenre.genre_id = :genreId', { genreId })
      .getOne();
  }

  // Nuevo método: encontrar asociación por su propio ID
  async findOneById(titleGenreId: string): Promise<TitleGenre | null> {
    return this.createQueryBuilder('titleGenre')
      .where('titleGenre.title_genre_id = :titleGenreId', { titleGenreId })
      .leftJoinAndSelect('titleGenre.title', 'title')
      .leftJoinAndSelect('titleGenre.genre', 'genre')
      .getOne();
  }

  create(titleGenrePartial: Partial<TitleGenre>): TitleGenre {
    return this.titleGenreORMRepository.create(titleGenrePartial);
  }

  async save(titleGenre: TitleGenre): Promise<TitleGenre> {
    return this.titleGenreORMRepository.save(titleGenre);
  }

  async delete(titleGenreId: string): Promise<void> {
    await this.titleGenreORMRepository.delete(titleGenreId);
  }
}
