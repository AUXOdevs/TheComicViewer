// src/favorites/favorites.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteDto } from './dto/favorite.dto';
import { plainToInstance } from 'class-transformer';
import { Favorite } from './entities/favorite.entity';
import { FavoriteRepository } from './favorites.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { UserService } from 'src/user/user.service';
import { TitlesService } from 'src/titles/titles.service';
import { GetAllFavoritesDto } from './dto/get-all-favorites.dto'; // Importar el nuevo DTO
import { ChapterDto } from 'src/chapters/dto/chapter.dto'; // Importar ChapterDto para transformación

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
    private readonly userService: UserService,
    private readonly titlesService: TitlesService,
  ) {}

  async create(
    userId: string,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteDto> {
    this.logger.debug(`create(): Añadiendo favorito para usuario ${userId}.`);

    let { title_id, chapter_id } = createFavoriteDto;
    let finalTitleId: string;
    let finalChapterId: string | null = null;

    if (!title_id && !chapter_id) {
      throw new BadRequestException(
        'Debe proporcionar un title_id o un chapter_id.',
      );
    }

    if (chapter_id) {
      const chapter = await this.chapterRepository.findOneById(chapter_id);
      if (!chapter) {
        throw new NotFoundException(
          `Capítulo con ID "${chapter_id}" no encontrado.`,
        );
      }
      if (!chapter.title_id) {
        this.logger.error(
          `Capítulo con ID "${chapter_id}" no está asociado a un título.`,
        );
        throw new InternalServerErrorException(
          `El capítulo con ID "${chapter_id}" no tiene un título asociado.`,
        );
      }

      finalChapterId = chapter_id;
      finalTitleId = chapter.title_id;

      if (title_id && title_id !== finalTitleId) {
        throw new BadRequestException(
          `El capítulo con ID "${chapter_id}" no pertenece al título con ID "${title_id}".`,
        );
      }
    } else {
      finalTitleId = title_id!;
      finalChapterId = null;
    }

    if (!chapter_id) {
      const existingTitle =
        await this.titleRepository.findOneById(finalTitleId);
      if (!existingTitle) {
        throw new NotFoundException(
          `Título con ID "${finalTitleId}" no encontrado.`,
        );
      }
    }

    const existingFavorite =
      await this.favoriteRepository.findOneByCompositeKeys(
        userId,
        finalTitleId,
        finalChapterId,
      );
    if (existingFavorite) {
      const type = finalChapterId ? 'Capítulo' : 'Título';
      const id = finalChapterId || finalTitleId;
      throw new ConflictException(
        `${type} con ID "${id}" ya está en los favoritos del usuario.`,
      );
    }

    const newFavorite = this.favoriteRepository.create({
      user_id: userId,
      title_id: finalTitleId,
      chapter_id: finalChapterId,
    });

    const savedFavorite = await this.favoriteRepository.save(newFavorite);
    this.logger.log(
      `create(): Favorito (ID: ${savedFavorite.favorite_id}) añadido para usuario ${userId}.`,
    );

    const favoriteWithRelations = await this.favoriteRepository.findOneById(
      savedFavorite.favorite_id,
    );
    if (!favoriteWithRelations) {
      throw new InternalServerErrorException(
        'Failed to retrieve favorite with relations after creation.',
      );
    }

    // Transformar y parsear el capítulo si existe
    const favoriteDto = plainToInstance(FavoriteDto, favoriteWithRelations);
    if (favoriteDto.chapter && typeof favoriteDto.chapter.pages === 'string') {
      favoriteDto.chapter.pages = JSON.parse(favoriteDto.chapter.pages);
    }
    return favoriteDto;
  }

  async findAllByUser(userId: string): Promise<FavoriteDto[]> {
    this.logger.debug(
      `findAllByUser(): Buscando favoritos para usuario ${userId}.`,
    );
    const favorites = await this.favoriteRepository.findAllByUserId(userId);
    if (!favorites || favorites.length === 0) {
      throw new NotFoundException(
        `No se encontraron favoritos para el usuario con ID ${userId}.`,
      );
    }
    // Transformar y parsear el capítulo si existe para cada favorito
    return favorites.map((favorite) => {
      const favoriteDto = plainToInstance(FavoriteDto, favorite);
      if (
        favoriteDto.chapter &&
        typeof favoriteDto.chapter.pages === 'string'
      ) {
        favoriteDto.chapter.pages = JSON.parse(favoriteDto.chapter.pages);
      }
      return favoriteDto;
    });
  }

  // Nuevo método para obtener favoritos paginados y filtrados
  async findAllPaginatedAndFiltered(
    userId: string,
    queryParams: GetAllFavoritesDto,
  ): Promise<{
    favorites: FavoriteDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.debug(
      `findAllPaginatedAndFiltered(): Buscando favoritos paginados y filtrados para usuario ${userId}.`,
    );

    const { favorites, total } =
      await this.favoriteRepository.findAllPaginatedAndFiltered(
        userId,
        queryParams,
      );

    // Transformar y parsear el capítulo si existe para cada favorito
    const favoritesWithParsedChapters: FavoriteDto[] = favorites.map(
      (favorite) => {
        const favoriteDto = plainToInstance(FavoriteDto, favorite);
        if (
          favoriteDto.chapter &&
          typeof favoriteDto.chapter.pages === 'string'
        ) {
          favoriteDto.chapter.pages = JSON.parse(favoriteDto.chapter.pages);
        }
        return favoriteDto;
      },
    );

    this.logger.log(
      `findAllPaginatedAndFiltered(): Encontrados ${total} favoritos para el usuario ${userId}.`,
    );
    return {
      favorites: favoritesWithParsedChapters,
      total,
      page: queryParams.page || 1,
      limit: queryParams.limit || 10,
    };
  }

  async findAllFavoritesOfUserByQuery(query: string): Promise<FavoriteDto[]> {
    this.logger.debug(
      `findAllFavoritesOfUserByQuery(): Buscando favoritos para usuario por query: "${query}".`,
    );

    let targetAuth0Id: string;

    if (query.includes('@')) {
      const user = await this.userService.findByEmail(query);
      if (!user) {
        throw new NotFoundException(
          `Usuario con email "${query}" no encontrado o inactivo.`,
        );
      }
      targetAuth0Id = user.auth0_id;
    } else {
      const user = await this.userService.findOne(query, true);
      if (!user) {
        throw new NotFoundException(
          `Usuario con ID "${query}" no encontrado o inactivo.`,
        );
      }
      targetAuth0Id = query;
    }

    const favorites =
      await this.favoriteRepository.findAllByUserId(targetAuth0Id);

    if (!favorites || favorites.length === 0) {
      throw new NotFoundException(
        `No se encontraron favoritos para el usuario (Auth0 ID: ${targetAuth0Id}).`,
      );
    }

    this.logger.log(
      `findAllFavoritesOfUserByQuery(): Encontrados ${favorites.length} favoritos para el usuario (Auth0 ID: ${targetAuth0Id}).`,
    );
    // Transformar y parsear el capítulo si existe para cada favorito
    return favorites.map((favorite) => {
      const favoriteDto = plainToInstance(FavoriteDto, favorite);
      if (
        favoriteDto.chapter &&
        typeof favoriteDto.chapter.pages === 'string'
      ) {
        favoriteDto.chapter.pages = JSON.parse(favoriteDto.chapter.pages);
      }
      return favoriteDto;
    });
  }

  async checkFavoriteStatus(
    userId: string,
    title_id?: string,
    chapter_id?: string,
  ): Promise<boolean> {
    this.logger.debug(
      `checkFavoriteStatus(): Verificando favorito para usuario ${userId}, title_id: ${title_id}, chapter_id: ${chapter_id}.`,
    );

    let finalTitleId: string;
    let finalChapterId: string | null = null;

    if (!title_id && !chapter_id) {
      throw new BadRequestException(
        'Debe proporcionar un title_id o un chapter_id para verificar el estado del favorito.',
      );
    }

    if (chapter_id) {
      const chapter = await this.chapterRepository.findOneById(chapter_id);
      if (!chapter) {
        return false;
      }
      if (!chapter.title_id) {
        this.logger.error(
          `Capítulo con ID "${chapter_id}" no está asociado a un título.`,
        );
        throw new InternalServerErrorException(
          `El capítulo con ID "${chapter_id}" no tiene un título asociado.`,
        );
      }

      finalChapterId = chapter_id;
      finalTitleId = chapter.title_id;

      if (title_id && title_id !== finalTitleId) {
        return false;
      }
    } else {
      finalTitleId = title_id!;
      finalChapterId = null;
    }

    const existingFavorite =
      await this.favoriteRepository.findOneByCompositeKeys(
        userId,
        finalTitleId,
        finalChapterId,
      );

    return !!existingFavorite;
  }

  async findOne(
    id: string,
    userId: string,
    hasUserPermission: boolean,
  ): Promise<FavoriteDto> {
    this.logger.debug(`findOne(): Buscando favorito con ID: ${id}.`);
    const favorite = await this.favoriteRepository.findOneById(id);
    if (!favorite) {
      this.logger.warn(`findOne(): Favorito con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Favorite with ID "${id}" not found.`);
    }

    const isOwner = favorite.user_id === userId;
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `findOne(): Usuario ${userId} intentó acceder al favorito ${id} de otro usuario sin permiso.`,
      );
      throw new ForbiddenException(
        'No tienes permisos para ver este favorito.',
      );
    }

    // Transformar y parsear el capítulo si existe
    const favoriteDto = plainToInstance(FavoriteDto, favorite);
    if (favoriteDto.chapter && typeof favoriteDto.chapter.pages === 'string') {
      favoriteDto.chapter.pages = JSON.parse(favoriteDto.chapter.pages);
    }
    return favoriteDto;
  }

  async isOwner(favoriteId: string, userId: string): Promise<boolean> {
    this.logger.debug(
      `isOwner(): Verificando propiedad para favorito ${favoriteId} y usuario ${userId}.`,
    );
    const favorite = await this.favoriteRepository.findOneById(favoriteId);
    return !!favorite && favorite.user_id === userId;
  }

  async remove(
    id: string,
    userId: string,
    hasUserPermission: boolean,
  ): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando favorito con ID: ${id} para usuario ${userId}.`,
    );
    const favorite = await this.favoriteRepository.findOneById(id);
    if (!favorite) {
      this.logger.warn(
        `remove(): Favorito con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Favorite with ID "${id}" not found.`);
    }

    const isOwner = favorite.user_id === userId;
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `remove(): Usuario ${userId} intentó eliminar el favorito ${id} de otro usuario sin permiso.`,
      );
      throw new ForbiddenException(
        'No tienes permisos para eliminar este favorito.',
      );
    }

    await this.favoriteRepository.delete(id);
    this.logger.log(
      `remove(): Favorito con ID "${id}" eliminado exitosamente para usuario ${userId}.`,
    );
  }
}
