import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Title } from './entities/title.entity';

@Injectable()
export class TitleRepository {
  constructor(
    @InjectRepository(Title)
    private readonly titleORMRepository: Repository<Title>,
  ) {}

  private createQueryBuilder(alias = 'title') {
    return this.titleORMRepository.createQueryBuilder(alias);
  }

  async findAll(): Promise<Title[]> {
    return this.createQueryBuilder('title')
      .leftJoinAndSelect('title.chapters', 'chapters')
      .leftJoinAndSelect('title.titleGenres', 'titleGenre')
      .leftJoinAndSelect('titleGenre.genre', 'genre')
      .getMany();
  }

  async findOneById(titleId: string): Promise<Title | null> {
    return this.createQueryBuilder('title')
      .leftJoinAndSelect('title.chapters', 'chapters')
      .leftJoinAndSelect('title.titleGenres', 'titleGenre')
      .leftJoinAndSelect('titleGenre.genre', 'genre')
      .where('title.title_id = :titleId', { titleId })
      .getOne();
  }

  create(titlePartial: Partial<Title>): Title {
    return this.titleORMRepository.create(titlePartial);
  }

  async save(title: Title): Promise<Title> {
    return this.titleORMRepository.save(title);
  }

  async delete(titleId: string): Promise<void> {
    await this.titleORMRepository.delete(titleId);
  }
}
