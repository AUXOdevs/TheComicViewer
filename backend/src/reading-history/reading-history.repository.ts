import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ReadingHistory } from './entities/reading-history.entity';
import { InjectRepository } from '@nestjs/typeorm';

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
      .leftJoinAndSelect('chapter.title', 'title') // Cargar título del capítulo
      .where('history.user_id = :userId', { userId })
      .orderBy('history.updated_at', 'DESC') // Ordenar por fecha de último acceso
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
