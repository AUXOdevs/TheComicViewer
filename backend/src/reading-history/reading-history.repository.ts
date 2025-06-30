import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReadingHistory } from './entities/reading-history.entity';

@Injectable()
export class ReadingHistoryRepository {
  constructor(
    @InjectRepository(ReadingHistory)
    private readonly readingHistoryORMRepository: Repository<ReadingHistory>,
  ) {}

  private createQueryBuilder(alias = 'history') {
    return this.readingHistoryORMRepository.createQueryBuilder(alias);
  }

  async findAllByUserId(userId: string): Promise<ReadingHistory[]> {
    return this.createQueryBuilder('history')
      .leftJoinAndSelect('history.user', 'user')
      .leftJoinAndSelect('history.chapter', 'chapter')
      .leftJoinAndSelect('history.title', 'title') // Asegura que el título se carga
      .where('history.user_id = :userId', { userId })
      .orderBy('history.updated_at', 'DESC')
      .getMany();
  }

  async findOneByUserIdAndChapterId(
    userId: string,
    chapterId: string,
  ): Promise<ReadingHistory | null> {
    return this.createQueryBuilder('history')
      .where('history.user_id = :userId', { userId })
      .andWhere('history.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  // Nuevo método: encontrar historial por su propio ID
  async findOneById(historyId: string): Promise<ReadingHistory | null> {
    return this.createQueryBuilder('history')
      .where('history.history_id = :historyId', { historyId })
      .leftJoinAndSelect('history.user', 'user') // IMPORTANTE: Cargar 'user' para las verificaciones de permisos en el servicio
      .leftJoinAndSelect('history.chapter', 'chapter')
      .leftJoinAndSelect('history.title', 'title') // Asegura que el título se carga
      .getOne();
  }

  create(historyPartial: Partial<ReadingHistory>): ReadingHistory {
    return this.readingHistoryORMRepository.create(historyPartial);
  }

  async save(history: ReadingHistory): Promise<ReadingHistory> {
    return this.readingHistoryORMRepository.save(history);
  }

  async delete(historyId: string): Promise<void> {
    await this.readingHistoryORMRepository.delete(historyId);
  }
}
