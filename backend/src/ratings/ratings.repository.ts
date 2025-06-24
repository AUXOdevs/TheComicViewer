import { Repository } from 'typeorm'; // Eliminado DataSource
import { Injectable } from '@nestjs/common';
import { Rating } from './entities/rating.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RatingRepository {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingORMRepository: Repository<Rating>,
  ) {}

  private createQueryBuilder(alias = 'rating') {
    return this.ratingORMRepository.createQueryBuilder(alias);
  }

  async findAverageScoreByTitleId(titleId: string): Promise<number | null> {
    const result = await this.createQueryBuilder('rating')
      .select('AVG(rating.score)', 'averageScore')
      .where('rating.title_id = :titleId', { titleId })
      .getRawOne();

    // getRawOne puede devolver el valor como string o null. Convertir a number.
    return result?.averageScore ? parseFloat(result.averageScore) : null;
  }

  // ************ NUEVO MÉTODO: Promedio por Capítulo ************
  async findAverageScoreByChapterId(chapterId: string): Promise<number | null> {
    const result = await this.createQueryBuilder('rating')
      .select('AVG(rating.score)', 'averageScore')
      .where('rating.chapter_id = :chapterId', { chapterId })
      .getRawOne();

    return result?.averageScore ? parseFloat(result.averageScore) : null;
  }
  // ************ FIN NUEVO MÉTODO ************

  async findAllByTitleId(titleId: string): Promise<Rating[]> {
    return this.createQueryBuilder('rating')
      .leftJoinAndSelect('rating.user', 'user') // Asegura que el usuario se carga para el servicio
      .where('rating.title_id = :titleId', { titleId })
      .getMany();
  }

  async findAllByChapterId(chapterId: string): Promise<Rating[]> {
    return this.createQueryBuilder('rating')
      .leftJoinAndSelect('rating.user', 'user') // Asegura que el usuario se carga para el servicio
      .where('rating.chapter_id = :chapterId', { chapterId })
      .getMany();
  }

  async findOneByUserAndTitle(
    userId: string,
    titleId: string,
  ): Promise<Rating | null> {
    return this.createQueryBuilder('rating')
      .where('rating.user_id = :userId', { userId })
      .andWhere('rating.title_id = :titleId', { titleId })
      .andWhere('rating.chapter_id IS NULL')
      .getOne();
  }

  async findOneByUserAndChapter(
    userId: string,
    chapterId: string,
  ): Promise<Rating | null> {
    return this.createQueryBuilder('rating')
      .where('rating.user_id = :userId', { userId })
      .andWhere('rating.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  async findOneById(ratingId: string): Promise<Rating | null> {
    return this.createQueryBuilder('rating')
      .leftJoinAndSelect('rating.user', 'user') // IMPORTANTE: Cargar la relación 'user' para las verificaciones de permisos
      .leftJoinAndSelect('rating.title', 'title')
      .leftJoinAndSelect('rating.chapter', 'chapter')
      .where('rating.rating_id = :ratingId', { ratingId })
      .getOne();
  }

  create(ratingPartial: Partial<Rating>): Rating {
    return this.ratingORMRepository.create(ratingPartial);
  }

  async save(rating: Rating): Promise<Rating> {
    return this.ratingORMRepository.save(rating);
  }

  async delete(ratingId: string): Promise<void> {
    await this.ratingORMRepository.delete(ratingId);
  }
}
