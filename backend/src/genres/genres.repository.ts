import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Genre } from './entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GenreRepository {
  constructor(
    @InjectRepository(Genre)
    private readonly genreORMRepository: Repository<Genre>,
  ) {}

  private createQueryBuilder(alias = 'genre') {
    return this.genreORMRepository.createQueryBuilder(alias);
  }

  async findAll(): Promise<Genre[]> {
    return this.createQueryBuilder('genre').getMany();
  }

  async findOneById(genreId: string): Promise<Genre | null> {
    return this.createQueryBuilder('genre')
      .where('genre.genre_id = :genreId', { genreId })
      .getOne();
  }

  async findByName(name: string): Promise<Genre | null> {
    return this.createQueryBuilder('genre')
      .where('genre.name = :name', { name })
      .getOne();
  }

  create(genrePartial: Partial<Genre>): Genre {
    return this.genreORMRepository.create(genrePartial);
  }

  async save(genre: Genre): Promise<Genre> {
    return this.genreORMRepository.save(genre);
  }

  async delete(genreId: string): Promise<void> {
    await this.genreORMRepository.delete(genreId);
  }
}
