import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { RatingDto } from './dto/rating.dto';
import { plainToInstance } from 'class-transformer';
import { Rating } from './entities/rating.entity';
import { RatingRepository } from './ratings.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async create(
    userId: string,
    createRatingDto: CreateRatingDto,
  ): Promise<RatingDto> {
    this.logger.debug(`create(): Creando calificación para usuario ${userId}.`);
    const { title_id, chapter_id, score } = createRatingDto;

    if (!title_id) {
      throw new BadRequestException('title_id must be provided for a rating.');
    }
    const existingTitle = await this.titleRepository.findOneById(title_id);
    if (!existingTitle) {
      throw new NotFoundException(`Title with ID "${title_id}" not found.`);
    }

    // Un usuario solo puede calificar un título/capítulo una vez
    if (chapter_id) {
      const existingChapter =
        await this.chapterRepository.findOneById(chapter_id);
      if (!existingChapter) {
        throw new NotFoundException(
          `Chapter with ID "${chapter_id}" not found.`,
        );
      }
      if (existingChapter.title_id !== title_id) {
        throw new BadRequestException(
          'Chapter does not belong to the specified title.',
        );
      }
      const existingRating =
        await this.ratingRepository.findOneByUserAndChapter(userId, chapter_id);
      if (existingRating) {
        throw new ConflictException(
          `User has already rated chapter "${chapter_id}".`,
        );
      }
    } else {
      const existingRating = await this.ratingRepository.findOneByUserAndTitle(
        userId,
        title_id,
      );
      if (existingRating) {
        throw new ConflictException(
          `User has already rated title "${title_id}".`,
        );
      }
    }

    const newRating = this.ratingRepository.create({
      user_id: userId,
      title_id,
      chapter_id: chapter_id || null,
      score,
    });

    const savedRating = await this.ratingRepository.save(newRating);
    this.logger.log(
      `create(): Calificación (ID: ${savedRating.rating_id}) creada por usuario ${userId} con score ${score}.`,
    );
    return plainToInstance(RatingDto, savedRating);
  }

  async findAllByTitle(titleId: string): Promise<RatingDto[]> {
    this.logger.debug(
      `findAllByTitle(): Buscando calificaciones para título con ID: ${titleId}.`,
    );
    const ratings = await this.ratingRepository.findAllByTitleId(titleId);
    return plainToInstance(RatingDto, ratings);
  }

  async findOne(id: string): Promise<RatingDto> {
    this.logger.debug(`findOne(): Buscando calificación con ID: ${id}.`);
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      this.logger.warn(`findOne(): Calificación con ID "${id}" no encontrada.`);
      throw new NotFoundException(`Rating with ID "${id}" not found.`);
    }
    return plainToInstance(RatingDto, rating);
  }

  async update(
    id: string,
    userId: string,
    updateRatingDto: UpdateRatingDto,
    isAdmin: boolean,
  ): Promise<RatingDto> {
    this.logger.debug(
      `update(): Actualizando calificación con ID: ${id} por usuario ${userId}.`,
    );
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      this.logger.warn(
        `update(): Calificación con ID "${id}" no encontrada para actualizar.`,
      );
      throw new NotFoundException(`Rating with ID "${id}" not found.`);
    }

    // Solo el dueño de la calificación o un admin pueden actualizar
    if (rating.user_id !== userId && !isAdmin) {
      this.logger.warn(
        `update(): Usuario ${userId} no autorizado para actualizar la calificación ${id}.`,
      );
      throw new BadRequestException(
        'You are not authorized to update this rating.',
      );
    }

    Object.assign(rating, updateRatingDto);
    const updatedRating = await this.ratingRepository.save(rating);
    this.logger.log(
      `update(): Calificación (ID: ${updatedRating.rating_id}) actualizada exitosamente a score ${updatedRating.score}.`,
    );
    return plainToInstance(RatingDto, updatedRating);
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando calificación con ID: ${id} por usuario ${userId}.`,
    );
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      this.logger.warn(
        `remove(): Calificación con ID "${id}" no encontrada para eliminar.`,
      );
      throw new NotFoundException(`Rating with ID "${id}" not found.`);
    }

    // Solo el dueño de la calificación o un admin pueden eliminar
    if (rating.user_id !== userId && !isAdmin) {
      this.logger.warn(
        `remove(): Usuario ${userId} no autorizado para eliminar la calificación ${id}.`,
      );
      throw new BadRequestException(
        'You are not authorized to delete this rating.',
      );
    }

    await this.ratingRepository.delete(id);
    this.logger.log(
      `remove(): Calificación con ID "${id}" eliminada exitosamente.`,
    );
  }
}
