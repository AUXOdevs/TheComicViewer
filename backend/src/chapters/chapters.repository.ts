// src/chapters/chapters.repository.ts
import { Repository, DataSource, Like, DeleteResult } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Chapter } from './entities/chapter.entity';
// NO se necesita InjectRepository al extender Repository
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderDto } from 'src/common/dto/order.dto';

@Injectable()
export class ChapterRepository extends Repository<Chapter> {
  private readonly logger = new Logger(ChapterRepository.name);

  constructor(private dataSource: DataSource) {
    super(Chapter, dataSource.createEntityManager());
  }

  private createQueryBuilderWithRelations(alias = 'chapter') {
    return this.createQueryBuilder(alias).leftJoinAndSelect(
      `${alias}.title`,
      'title',
    ); // Siempre cargar el título para contexto
  }

  async findAllPaginated(
    paginationOptions: PaginationDto,
    orderOptions: OrderDto,
    nameFilter?: string,
    chapterNumberFilter?: number,
    titleIdFilter?: string,
    titleNameFilter?: string,
  ): Promise<{ chapters: Chapter[]; total: number }> {
    this.logger.debug(
      `findAllPaginated(): Buscando capítulos paginados con filtros: ${JSON.stringify({ paginationOptions, orderOptions, nameFilter, chapterNumberFilter, titleIdFilter, titleNameFilter })}`,
    );
    const { page, limit } = paginationOptions;
    const { sortBy, order } = orderOptions;

    const queryBuilder = this.createQueryBuilderWithRelations('chapter');

    if (nameFilter) {
      queryBuilder.andWhere('LOWER(chapter.name) LIKE LOWER(:nameFilter)', {
        nameFilter: `%${nameFilter}%`,
      });
    }
    if (chapterNumberFilter !== undefined) {
      queryBuilder.andWhere('chapter.chapter_number = :chapterNumberFilter', {
        chapterNumberFilter,
      });
    }
    if (titleIdFilter) {
      queryBuilder.andWhere('chapter.title_id = :titleIdFilter', {
        titleIdFilter,
      });
    }
    if (titleNameFilter) {
      queryBuilder.andWhere('LOWER(title.name) LIKE LOWER(:titleNameFilter)', {
        titleNameFilter: `%${titleNameFilter}%`,
      });
    }

    const validSortColumns = {
      created_at: 'chapter.created_at',
      name: 'chapter.name',
      chapter_number: 'chapter.chapter_number',
      release_date: 'chapter.release_date',
    };

    const actualSortBy = validSortColumns[sortBy] || 'chapter.created_at';

    queryBuilder.orderBy(actualSortBy, order);

    const [chapters, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { chapters, total };
  }

  async findByName(name: string): Promise<Chapter[]> {
    this.logger.debug(`findByName(): Buscando capítulos con nombre: ${name}`);
    return this.createQueryBuilderWithRelations('chapter')
      .where('LOWER(chapter.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .getMany();
  }

  async findAllByTitleName(titleName: string): Promise<Chapter[]> {
    this.logger.debug(
      `findAllByTitleName(): Buscando capítulos para título con nombre: ${titleName}`,
    );
    return this.createQueryBuilderWithRelations('chapter')
      .andWhere('LOWER(title.name) LIKE LOWER(:titleName)', {
        titleName: `%${titleName}%`,
      })
      .orderBy('chapter.chapter_number', 'ASC')
      .getMany();
  }

  async findAllByTitleId(titleId: string): Promise<Chapter[]> {
    this.logger.debug(
      `findAllByTitleId(): Buscando capítulos para el título con ID: ${titleId}`,
    );
    return this.createQueryBuilderWithRelations('chapter')
      .where('chapter.title_id = :titleId', { titleId })
      .orderBy('chapter.chapter_number', 'ASC')
      .getMany();
  }

  async findOneById(chapterId: string): Promise<Chapter | null> {
    this.logger.debug(`findOneById(): Buscando capítulo con ID: ${chapterId}`);
    return this.createQueryBuilderWithRelations('chapter')
      .where('chapter.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  async findByTitleIdAndChapterNumber(
    titleId: string,
    chapterNumber: number,
  ): Promise<Chapter | null> {
    return this.createQueryBuilder('chapter')
      .where('chapter.title_id = :titleId', { titleId })
      .andWhere('chapter.chapter_number = :chapterNumber', { chapterNumber })
      .getOne();
  }

  // Los métodos `create` y `save` son heredados.
  // El método `delete` también es heredado y retorna DeleteResult.
  // No necesitamos redefinirlos aquí a menos que sea una lógica custom.
}
