// src/favorites/favorites.repository.ts
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Favorite } from './entities/favorite.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GetAllFavoritesDto,
  OrderDirection,
} from './dto/get-all-favorites.dto'; // Importar el nuevo DTO y enum

@Injectable()
export class FavoriteRepository {
  private readonly logger = new Logger(FavoriteRepository.name);

  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteORMRepository: Repository<Favorite>,
  ) {}

  private createQueryBuilder(alias = 'favorite') {
    return this.favoriteORMRepository.createQueryBuilder(alias);
  }

  async findAllByUserId(userId: string): Promise<Favorite[]> {
    this.logger.debug(
      `findAllByUserId(): Buscando favoritos para usuario ${userId}.`,
    );
    return this.createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.user', 'user')
      .leftJoinAndSelect('favorite.title', 'title')
      .leftJoinAndSelect('favorite.chapter', 'chapter')
      .where('favorite.user_id = :userId', { userId })
      .getMany();
  }

  async findAllPaginatedAndFiltered(
    userId: string,
    queryParams: GetAllFavoritesDto,
  ): Promise<{ favorites: Favorite[]; total: number }> {
    this.logger.debug(
      `findAllPaginatedAndFiltered(): Buscando favoritos paginados y filtrados para usuario ${userId} con filtros: ${JSON.stringify(queryParams)}`,
    );

    const {
      page,
      limit,
      sortBy,
      order,
      titleName,
      chapterName,
      isTitleFavorite,
    } = queryParams;

    const queryBuilder = this.createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.user', 'user')
      .leftJoinAndSelect('favorite.title', 'title')
      .leftJoinAndSelect('favorite.chapter', 'chapter')
      .where('favorite.user_id = :userId', { userId });

    // Aplicar filtros
    if (titleName) {
      queryBuilder.andWhere('LOWER(title.name) LIKE LOWER(:titleName)', {
        titleName: `%${titleName}%`,
      });
    }

    if (chapterName) {
      // Solo buscar en capítulos si chapter_id no es nulo
      queryBuilder.andWhere('favorite.chapter_id IS NOT NULL');
      queryBuilder.andWhere('LOWER(chapter.name) LIKE LOWER(:chapterName)', {
        chapterName: `%${chapterName}%`,
      });
    }

    if (isTitleFavorite !== undefined) {
      if (isTitleFavorite) {
        queryBuilder.andWhere('favorite.chapter_id IS NULL'); // Solo favoritos de títulos
      } else {
        queryBuilder.andWhere('favorite.chapter_id IS NOT NULL'); // Solo favoritos de capítulos
      }
    }

    // Mapeo de columnas para ordenar
    const validSortColumns = {
      date_added: 'favorite.date_added',
      title_name: 'title.name', // Ordenar por nombre de título
      chapter_number: 'chapter.chapter_number', // Ordenar por número de capítulo
      // Puedes añadir más columnas si es necesario
    };

    const actualSortBy = validSortColumns[sortBy] || 'favorite.date_added';
    queryBuilder.orderBy(actualSortBy, order || OrderDirection.DESC);

    // Aplicar paginación
    const [favorites, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { favorites, total };
  }

  async findOneByUserAndTitle(
    userId: string,
    titleId: string,
  ): Promise<Favorite | null> {
    this.logger.debug(
      `findOneByUserAndTitle(): Buscando favorito de título para usuario ${userId} y título ${titleId}.`,
    );
    return this.createQueryBuilder('favorite')
      .where('favorite.user_id = :userId', { userId })
      .andWhere('favorite.title_id = :titleId', { titleId })
      .andWhere('favorite.chapter_id IS NULL')
      .getOne();
  }

  async findOneByUserAndChapter(
    userId: string,
    chapterId: string,
  ): Promise<Favorite | null> {
    this.logger.debug(
      `findOneByUserAndChapter(): Buscando favorito de capítulo para usuario ${userId} y capítulo ${chapterId}.`,
    );
    return this.createQueryBuilder('favorite')
      .where('favorite.user_id = :userId', { userId })
      .andWhere('favorite.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  async findOneByCompositeKeys(
    userId: string,
    titleId: string,
    chapterId: string | null,
  ): Promise<Favorite | null> {
    this.logger.debug(
      `findOneByCompositeKeys(): Buscando favorito por claves compuestas para usuario ${userId}, título ${titleId}, capítulo ${chapterId}.`,
    );
    const query = this.createQueryBuilder('favorite')
      .where('favorite.user_id = :userId', { userId })
      .andWhere('favorite.title_id = :titleId', { titleId });

    if (chapterId === null) {
      query.andWhere('favorite.chapter_id IS NULL');
    } else {
      query.andWhere('favorite.chapter_id = :chapterId', { chapterId });
    }
    return query.getOne();
  }

  async findOneById(favoriteId: string): Promise<Favorite | null> {
    this.logger.debug(
      `findOneById(): Buscando favorito con ID: ${favoriteId}.`,
    );
    return this.createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.user', 'user')
      .leftJoinAndSelect('favorite.title', 'title')
      .leftJoinAndSelect('favorite.chapter', 'chapter')
      .where('favorite.favorite_id = :favoriteId', { favoriteId })
      .getOne();
  }

  create(favoritePartial: Partial<Favorite>): Favorite {
    this.logger.debug(`create(): Creando entidad favorita en memoria.`);
    return this.favoriteORMRepository.create(favoritePartial);
  }

  async save(favorite: Favorite): Promise<Favorite> {
    this.logger.debug(
      `save(): Guardando entidad favorita en la base de datos.`,
    );
    return this.favoriteORMRepository.save(favorite);
  }

  async delete(favoriteId: string): Promise<void> {
    this.logger.debug(`delete(): Eliminando favorito con ID: ${favoriteId}.`);
    await this.favoriteORMRepository.delete(favoriteId);
  }
}
