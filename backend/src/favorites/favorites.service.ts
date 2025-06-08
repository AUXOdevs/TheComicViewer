import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
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
        'Either title_id or chapter_id must be provided.',
      );
    }
    if (title_id && chapter_id) {
      throw new BadRequestException(
        'Cannot favorite both a title and a chapter in the same entry.',
      );
    }

    if (title_id) {
      const existingTitle = await this.titleRepository.findOneById(title_id);
      if (!existingTitle) {
        throw new NotFoundException(`Title with ID "${title_id}" not found.`);
      }
      const existingFavorite =
        await this.favoriteRepository.findOneByUserAndTitle(userId, title_id);
      if (existingFavorite) {
        throw new ConflictException(
          `Title with ID "${title_id}" is already in user's favorites.`,
        );
      }
    }

    if (chapter_id) {
      const existingChapter =
        await this.chapterRepository.findOneById(chapter_id);
      if (!existingChapter) {
        throw new NotFoundException(
          `Chapter with ID "${chapter_id}" not found.`,
        );
      }
      const existingFavorite =
        await this.favoriteRepository.findOneByUserAndChapter(
          userId,
          chapter_id,
        );
      if (existingFavorite) {
        throw new ConflictException(
          `Chapter with ID "${chapter_id}" is already in user's favorites.`,
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
      `create(): Favorito (ID: ${savedFavorite.favorite_id}) añadido para usuario ${userId}.`,
    );
    return plainToInstance(FavoriteDto, savedFavorite);
  }

  async findAllByUser(userId: string): Promise<FavoriteDto[]> {
    this.logger.debug(
      `findAllByUser(): Buscando favoritos para usuario ${userId}.`,
    );
    const favorites = await this.favoriteRepository.findAllByUserId(userId);
    return plainToInstance(FavoriteDto, favorites);
  }

  async findOne(id: string, userId: string): Promise<FavoriteDto> {
    this.logger.debug(
      `findOne(): Buscando favorito con ID: ${id} para usuario ${userId}.`,
    );
    const favorite = await this.favoriteRepository.findOneById(id);
    if (!favorite) {
      this.logger.warn(`findOne(): Favorito con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Favorite with ID "${id}" not found.`);
    }
    if (favorite.user_id !== userId) {
      this.logger.warn(
        `findOne(): Usuario ${userId} intentó acceder al favorito ${id} de otro usuario.`,
      );
      throw new BadRequestException(
        `Favorite with ID "${id}" does not belong to user ${userId}.`,
      );
    }
    return plainToInstance(FavoriteDto, favorite);
  }

  async remove(id: string, userId: string): Promise<void> {
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
    if (favorite.user_id !== userId) {
      this.logger.warn(
        `remove(): Usuario ${userId} intentó eliminar el favorito ${id} de otro usuario.`,
      );
      throw new BadRequestException(
        `Favorite with ID "${id}" does not belong to user ${userId}.`,
      );
    }
    await this.favoriteRepository.delete(id);
    this.logger.log(
      `remove(): Favorito con ID "${id}" eliminado exitosamente para usuario ${userId}.`,
    );
  }
}
