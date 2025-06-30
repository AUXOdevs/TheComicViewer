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
import { UserService } from 'src/user/user.service'; // Asegúrate que esta ruta es correcta
import { TitlesService } from 'src/titles/titles.service'; // Asegúrate de importar TitlesService

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
    private readonly userService: UserService,
    private readonly titlesService: TitlesService, // Inyectar TitlesService
  ) {}

  async create(
    userId: string, // Este userId es el auth0_id del usuario autenticado
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteDto> {
    this.logger.debug(`create(): Añadiendo favorito para usuario ${userId}.`);

    let { title_id, chapter_id } = createFavoriteDto;
    let finalTitleId: string;
    let finalChapterId: string | null = null;

    // 1. Validar que al menos uno esté presente
    if (!title_id && !chapter_id) {
      throw new BadRequestException(
        'Debe proporcionar un title_id o un chapter_id.',
      );
    }

    // 2. Lógica para determinar finalTitleId y finalChapterId
    if (chapter_id) {
      // Usar findOneById del ChapterRepository, que ya carga el título
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
      finalTitleId = chapter.title_id; // Obtener el title_id del capítulo

      // Si title_id también fue proporcionado en el DTO, verificar que coincida
      if (title_id && title_id !== finalTitleId) {
        throw new BadRequestException(
          `El capítulo con ID "${chapter_id}" no pertenece al título con ID "${title_id}".`,
        );
      }
    } else {
      // Solo title_id es proporcionado
      finalTitleId = title_id!;
      finalChapterId = null;
    }

    // 3. Verificar existencia del título (solo si no se partió de un capítulo)
    if (!chapter_id) {
      const existingTitle =
        await this.titleRepository.findOneById(finalTitleId);
      if (!existingTitle) {
        throw new NotFoundException(
          `Título con ID "${finalTitleId}" no encontrado.`,
        );
      }
    }

    // 4. Verificar duplicados usando la combinación final
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

    // 5. Crear y guardar el nuevo favorito
    const newFavorite = this.favoriteRepository.create({
      user_id: userId,
      title_id: finalTitleId,
      chapter_id: finalChapterId,
    });

    const savedFavorite = await this.favoriteRepository.save(newFavorite);
    this.logger.log(
      `create(): Favorito (ID: ${savedFavorite.favorite_id}) añadido para usuario ${userId}.`,
    );

    // Cargar relaciones para el DTO de retorno
    const favoriteWithRelations = await this.favoriteRepository.findOneById(
      savedFavorite.favorite_id,
    );
    if (!favoriteWithRelations) {
      throw new InternalServerErrorException(
        'Failed to retrieve favorite with relations after creation.',
      );
    }
    return plainToInstance(FavoriteDto, favoriteWithRelations);
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
    return plainToInstance(FavoriteDto, favorites);
  }

  async findAllFavoritesOfUserByQuery(query: string): Promise<FavoriteDto[]> {
    this.logger.debug(
      `findAllFavoritesOfUserByQuery(): Buscando favoritos para usuario por query: "${query}".`,
    );

    let targetAuth0Id: string;

    if (query.includes('@')) {
      // <<-- CORRECCIÓN AQUÍ: Llamar findByEmail sin el segundo argumento
      const user = await this.userService.findByEmail(query);
      if (!user) {
        throw new NotFoundException(
          `Usuario con email "${query}" no encontrado o inactivo.`,
        );
      }
      targetAuth0Id = user.auth0_id;
    } else {
      // <<-- CORRECCIÓN AQUÍ: Usar findOne y pasar `true` para `includeDeleted` si es para Auth.
      const user = await this.userService.findOne(query, true); // `true` para incluir usuarios soft-deleted
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
    return plainToInstance(FavoriteDto, favorites);
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

    return plainToInstance(FavoriteDto, favorite);
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
