// src/reading-history/reading-history.repository.ts
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReadingHistory } from './entities/reading-history.entity';
import {
  GetAllReadingHistoryDto,
  OrderDirection,
} from './dto/get-all-reading-history.dto'; // Importar el nuevo DTO y enum

@Injectable()
export class ReadingHistoryRepository {
  private readonly logger = new Logger(ReadingHistoryRepository.name);

  constructor(
    @InjectRepository(ReadingHistory)
    private readonly readingHistoryORMRepository: Repository<ReadingHistory>,
  ) {}

  private createQueryBuilder(alias = 'history') {
    return this.readingHistoryORMRepository.createQueryBuilder(alias);
  }

  async findAllByUserId(userId: string): Promise<ReadingHistory[]> {
    this.logger.debug(
      `findAllByUserId(): Buscando historial de lectura para usuario ${userId}.`,
    );
    return this.createQueryBuilder('history')
      .leftJoinAndSelect('history.user', 'user')
      .leftJoinAndSelect('history.chapter', 'chapter')
      .leftJoinAndSelect('history.title', 'title')
      .where('history.user_id = :userId', { userId })
      .orderBy('history.updated_at', 'DESC')
      .getMany();
  }

  // Nuevo método para obtener historial paginado y filtrado
  async findAllPaginatedAndFiltered(
    queryParams: GetAllReadingHistoryDto,
  ): Promise<{ histories: ReadingHistory[]; total: number }> {
    this.logger.debug(
      `findAllPaginatedAndFiltered(): Buscando historial paginado y filtrado con filtros: ${JSON.stringify(queryParams)}`,
    );

    const {
      page,
      limit,
      sortBy,
      order,
      userId,
      username,
      titleName,
      chapterName,
      completed,
    } = queryParams;

    const queryBuilder = this.createQueryBuilder('history')
      .leftJoinAndSelect('history.user', 'user')
      .leftJoinAndSelect('history.chapter', 'chapter')
      .leftJoinAndSelect('history.title', 'title');

    // Aplicar filtros
    if (userId) {
      queryBuilder.andWhere('history.user_id = :userId', { userId });
    }
    if (username) {
      queryBuilder.andWhere('LOWER(user.name) LIKE LOWER(:username)', {
        username: `%${username}%`,
      });
    }
    if (titleName) {
      queryBuilder.andWhere('LOWER(title.name) LIKE LOWER(:titleName)', {
        titleName: `%${titleName}%`,
      });
    }
    if (chapterName) {
      queryBuilder.andWhere('LOWER(chapter.name) LIKE LOWER(:chapterName)', {
        chapterName: `%${chapterName}%`,
      });
    }
    if (completed !== undefined) {
      queryBuilder.andWhere('history.completed = :completed', { completed });
    }

    // Mapeo de columnas para ordenar
    const validSortColumns = {
      access_date: 'history.access_date',
      updated_at: 'history.updated_at',
      user_username: 'user.name', // Asumiendo 'name' es el campo de nombre de usuario
      title_name: 'title.name',
      chapter_number: 'chapter.chapter_number',
      completed: 'history.completed',
    };

    const actualSortBy = validSortColumns[sortBy] || 'history.updated_at';
    queryBuilder.orderBy(actualSortBy, order || OrderDirection.DESC);

    // Aplicar paginación
    const [histories, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { histories, total };
  }

  async findOneByUserIdAndChapterId(
    userId: string,
    chapterId: string,
  ): Promise<ReadingHistory | null> {
    this.logger.debug(
      `findOneByUserIdAndChapterId(): Buscando historial para usuario ${userId} y capítulo ${chapterId}.`,
    );
    return this.createQueryBuilder('history')
      .where('history.user_id = :userId', { userId })
      .andWhere('history.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  async findOneById(historyId: string): Promise<ReadingHistory | null> {
    this.logger.debug(
      `findOneById(): Buscando historial con ID: ${historyId}.`,
    );
    return this.createQueryBuilder('history')
      .where('history.history_id = :historyId', { historyId })
      .leftJoinAndSelect('history.user', 'user')
      .leftJoinAndSelect('history.chapter', 'chapter')
      .leftJoinAndSelect('history.title', 'title')
      .getOne();
  }

  create(historyPartial: Partial<ReadingHistory>): ReadingHistory {
    this.logger.debug(
      `create(): Creando entidad de historial de lectura en memoria.`,
    );
    return this.readingHistoryORMRepository.create(historyPartial);
  }

  async save(history: ReadingHistory): Promise<ReadingHistory> {
    this.logger.debug(
      `save(): Guardando entidad de historial de lectura en la base de datos.`,
    );
    return this.readingHistoryORMRepository.save(history);
  }

  async delete(historyId: string): Promise<void> {
    this.logger.debug(`delete(): Eliminando historial con ID: ${historyId}.`);
    await this.readingHistoryORMRepository.delete(historyId);
  }
}
