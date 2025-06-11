import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Favorite } from './entities/favorite.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FavoriteRepository {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteORMRepository: Repository<Favorite>,
  ) {}

  private createQueryBuilder(alias = 'favorite') {
    return this.favoriteORMRepository.createQueryBuilder(alias);
  }

  async findAllByUserId(userId: string): Promise<Favorite[]> {
    return this.createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.user', 'user')
      .leftJoinAndSelect('favorite.title', 'title')
      .leftJoinAndSelect('favorite.chapter', 'chapter')
      .where('favorite.user_id = :userId', { userId })
      .getMany();
  }

  async findOneByUserAndTitle(
    userId: string,
    titleId: string,
  ): Promise<Favorite | null> {
    return this.createQueryBuilder('favorite')
      .where('favorite.user_id = :userId', { userId })
      .andWhere('favorite.title_id = :titleId', { titleId })
      .andWhere('favorite.chapter_id IS NULL') // Asegura que es un favorito de título, no de capítulo
      .getOne();
  }

  async findOneByUserAndChapter(
    userId: string,
    chapterId: string,
  ): Promise<Favorite | null> {
    return this.createQueryBuilder('favorite')
      .where('favorite.user_id = :userId', { userId })
      .andWhere('favorite.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  async findOneById(favoriteId: string): Promise<Favorite | null> {
    return this.createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.user', 'user')
      .leftJoinAndSelect('favorite.title', 'title')
      .leftJoinAndSelect('favorite.chapter', 'chapter')
      .where('favorite.favorite_id = :favoriteId', { favoriteId })
      .getOne();
  }

  create(favoritePartial: Partial<Favorite>): Favorite {
    return this.favoriteORMRepository.create(favoritePartial);
  }

  async save(favorite: Favorite): Promise<Favorite> {
    return this.favoriteORMRepository.save(favorite);
  }

  async delete(favoriteId: string): Promise<void> {
    await this.favoriteORMRepository.delete(favoriteId);
  }
}
