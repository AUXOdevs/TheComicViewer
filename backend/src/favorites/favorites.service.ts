import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  ForbiddenException, // Importar ForbiddenException
} from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteDto } from './dto/favorite.dto';
import { plainToInstance } from 'class-transformer';
import { Favorite } from './entities/favorite.entity';
import { FavoriteRepository } from './favorites.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async create(
    userId: string,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteDto> {
    this.logger.debug(`create(): Añadiendo favorito para usuario ${userId}.`);

    const { title_id, chapter_id } = createFavoriteDto;

    if (!title_id && !chapter_id) {
      throw new BadRequestException(
        'Debe proporcionar un title_id o un chapter_id.',
      );
    }
    if (title_id && chapter_id) {
      throw new BadRequestException(
        'No se puede marcar como favorito un título y un capítulo en la misma entrada.',
      );
    }

    if (title_id) {
      const existingTitle = await this.titleRepository.findOneById(title_id);
      if (!existingTitle) {
        throw new NotFoundException(
          `Título con ID "${title_id}" no encontrado.`,
        );
      }
      const existingFavorite =
        await this.favoriteRepository.findOneByUserAndTitle(userId, title_id);
      if (existingFavorite) {
        throw new ConflictException(
          `Título con ID "${title_id}" ya está en los favoritos del usuario.`,
        );
      }
    }

    if (chapter_id) {
      const existingChapter =
        await this.chapterRepository.findOneById(chapter_id);
      if (!existingChapter) {
        throw new NotFoundException(
          `Capítulo con ID "${chapter_id}" no encontrado.`,
        );
      }
      const existingFavorite =
        await this.favoriteRepository.findOneByUserAndChapter(
          userId,
          chapter_id,
        );
      if (existingFavorite) {
        throw new ConflictException(
          `Capítulo con ID "${chapter_id}" ya está en los favoritos del usuario.`,
        );
      }
    }

    const newFavorite = this.favoriteRepository.create({
      user_id: userId,
      title_id: title_id || null,
      chapter_id: chapter_id || null,
    });

    const savedFavorite = await this.favoriteRepository.save(newFavorite);
    this.logger.log(
      `create(): Favorito (ID: ${savedFavorite.favorite_id}) añadido para usuario ${userId}.`, // Usar .favorite_id que es la PK de tu entidad
    );
    return plainToInstance(FavoriteDto, savedFavorite);
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

  /**
   * Obtiene un favorito por su ID, con validación de propiedad o permiso de administrador.
   * @param id El ID único del favorito.
   * @param userId El ID de Auth0 del usuario que realiza la petición.
   * @param hasUserPermission Indica si el usuario tiene permiso de gestión de usuarios (Admin/Superadmin).
   * @returns El objeto FavoriteDto encontrado.
   * @throws NotFoundException si el favorito no existe.
   * @throws ForbiddenException si el usuario no es el propietario y no tiene permiso.
   */
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

    // Verificar si el usuario es el propietario o si es un admin con permiso
    const isOwner = favorite.user_id === userId; // Usar favorite.user_id de la entidad Favorite
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

  /**
   * Verifica si un usuario es el propietario de un favorito.
   * Este método es interno para la lógica del controlador.
   * @param favoriteId El ID del favorito.
   * @param userId El ID de Auth0 del usuario.
   * @returns True si el usuario es el propietario, false en caso contrario.
   */
  async isOwner(favoriteId: string, userId: string): Promise<boolean> {
    this.logger.debug(
      `isOwner(): Verificando propiedad para favorito ${favoriteId} y usuario ${userId}.`,
    );
    const favorite = await this.favoriteRepository.findOneById(favoriteId);
    return !!favorite && favorite.user_id === userId; // Asumimos que Favorite tiene user_id directamente
  }

  /**
   * Elimina un favorito por su ID, con validación de propiedad o permiso de administrador.
   * @param id El ID único del favorito.
   * @param userId El ID de Auth0 del usuario que intenta eliminar.
   * @param hasUserPermission Indica si el usuario tiene permiso de gestión de usuarios (Admin/Superadmin).
   * @returns void
   * @throws NotFoundException si el favorito no existe.
   * @throws ForbiddenException si el usuario no es el propietario y no tiene permiso.
   */
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

    // Verificar si el usuario es el propietario O si es un admin con permiso
    const isOwner = favorite.user_id === userId; // Usar favorite.user_id de la entidad Favorite
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `remove(): Usuario ${userId} intentó eliminar el favorito ${id} de otro usuario sin permiso.`,
      );
      throw new ForbiddenException(
        'No tienes permisos para eliminar este favorito.',
      );
    }

    await this.favoriteRepository.delete(id); // Asume que tu repositorio personalizado tiene un método delete(id)
    this.logger.log(
      `remove(): Favorito con ID "${id}" eliminado exitosamente para usuario ${userId}.`,
    );
  }
}
