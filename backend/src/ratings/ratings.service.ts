import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { RatingDto } from './dto/rating.dto';
import { plainToInstance } from 'class-transformer';
import { Rating } from './entities/rating.entity';
import { RatingRepository } from './ratings.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { User } from 'src/user/entities/user.entity'; // Importar la entidad User

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);
  private readonly DEFAULT_RATING_IF_NONE = 3; // Media por defecto si no hay calificaciones

  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async create(
    userId: string, // auth0_id del usuario creador
    createRatingDto: CreateRatingDto,
  ): Promise<RatingDto> {
    this.logger.debug(`create(): Creando calificación para usuario ${userId}.`);
    const { title_id, chapter_id, score } = createRatingDto;

    if (!title_id) {
      throw new BadRequestException(
        'title_id debe ser proporcionado para una calificación.',
      );
    }
    const existingTitle = await this.titleRepository.findOneById(title_id);
    if (!existingTitle) {
      throw new NotFoundException(`Título con ID "${title_id}" no encontrado.`);
    }

    // Un usuario solo puede calificar un título/capítulo una vez
    if (chapter_id) {
      const existingChapter =
        await this.chapterRepository.findOneById(chapter_id);
      if (!existingChapter) {
        throw new NotFoundException(
          `Capítulo con ID "${chapter_id}" no encontrado.`,
        );
      }
      if (existingChapter.title_id !== title_id) {
        throw new BadRequestException(
          'El capítulo no pertenece al título especificado.',
        );
      }
      const existingRating =
        await this.ratingRepository.findOneByUserAndChapter(userId, chapter_id);
      if (existingRating) {
        throw new ConflictException(
          `El usuario ya ha calificado el capítulo "${chapter_id}".`,
        );
      }
    } else {
      // Si no hay chapter_id, es una calificación de título
      const existingRating = await this.ratingRepository.findOneByUserAndTitle(
        userId,
        title_id,
      );
      if (existingRating) {
        throw new ConflictException(
          `El usuario ya ha calificado el título "${title_id}".`,
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
    if (!ratings || ratings.length === 0) {
      this.logger.warn(
        `findAllByTitle(): No se encontraron calificaciones para el título "${titleId}".`,
      );
    }
    return plainToInstance(RatingDto, ratings);
  }

  // ************ NUEVO MÉTODO: Obtener promedio de calificación de un título ************
  async getAverageRatingForTitle(titleId: string): Promise<number> {
    this.logger.debug(
      `getAverageRatingForTitle(): Calculando promedio para título ${titleId}.`,
    );
    const average =
      await this.ratingRepository.findAverageScoreByTitleId(titleId);
    // Si no hay calificaciones, devuelve la media por defecto
    return average !== null
      ? parseFloat(average.toFixed(1))
      : this.DEFAULT_RATING_IF_NONE;
  }
  // ************ FIN NUEVO MÉTODO ************

  // ************ NUEVO MÉTODO: Obtener promedio de calificación de un capítulo ************
  async getAverageRatingForChapter(chapterId: string): Promise<number> {
    this.logger.debug(
      `getAverageRatingForChapter(): Calculando promedio para capítulo ${chapterId}.`,
    );
    const average =
      await this.ratingRepository.findAverageScoreByChapterId(chapterId);
    // Si no hay calificaciones, devuelve la media por defecto
    return average !== null
      ? parseFloat(average.toFixed(1))
      : this.DEFAULT_RATING_IF_NONE;
  }
  // ************ FIN NUEVO MÉTODO ************

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
    currentUser: User, // Recibe el objeto User completo del usuario autenticado
    updateRatingDto: UpdateRatingDto,
  ): Promise<RatingDto> {
    this.logger.debug(
      `update(): Actualizando calificación con ID: ${id} por usuario ${currentUser.auth0_id}.`,
    );
    // Necesitamos cargar el rating con su relación 'user' para verificar el rol del dueño
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      this.logger.warn(
        `update(): Calificación con ID "${id}" no encontrada para actualizar.`,
      );
      throw new NotFoundException(`Rating with ID "${id}" not found.`);
    }

    const isOwner = rating.user_id === currentUser.auth0_id;
    const currentUserRole = currentUser.role?.name;
    const ratingOwnerRole = rating.user?.role?.name; // Rol del dueño de la calificación

    const hasModerationPermission =
      (currentUserRole === 'admin' || currentUserRole === 'superadmin') &&
      currentUser.admin?.moderation_permission;

    // Lógica de permisos detallada:
    if (!isOwner) {
      // Si no es el propietario
      if (!hasModerationPermission) {
        // Y no tiene permiso de moderación
        this.logger.warn(
          `update(): Usuario ${currentUser.auth0_id} no autorizado (no propietario y sin permiso de moderación) para actualizar la calificación ${id}.`,
        );
        throw new ForbiddenException(
          'No tienes permisos para actualizar esta calificación.',
        );
      }

      // Si tiene permiso de moderación, verificar jerarquía
      if (
        currentUserRole === 'admin' && // Si el usuario actual es un admin
        ratingOwnerRole === 'superadmin' // Y el dueño de la calificación es un superadmin
      ) {
        this.logger.warn(
          `update(): Admin ${currentUser.auth0_id} intentó actualizar calificación de Superadmin ${rating.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede modificar calificaciones de superadministradores.',
        );
      }
    }

    // Si llegó hasta aquí, el usuario tiene permiso para actualizar
    Object.assign(rating, updateRatingDto); // Asignar el nuevo score
    const updatedRating = await this.ratingRepository.save(rating);
    this.logger.log(
      `update(): Calificación (ID: ${updatedRating.rating_id}) actualizada exitosamente a score ${updatedRating.score} por usuario ${currentUser.auth0_id}.`,
    );
    return plainToInstance(RatingDto, updatedRating);
  }

  async remove(
    id: string,
    currentUser: User, // Recibe el objeto User completo del usuario autenticado
  ): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando calificación con ID: ${id} por usuario ${currentUser.auth0_id}.`,
    );
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      this.logger.warn(
        `remove(): Calificación con ID "${id}" no encontrada para eliminar.`,
      );
      throw new NotFoundException(`Rating with ID "${id}" not found.`);
    }

    const isOwner = rating.user_id === currentUser.auth0_id;
    const currentUserRole = currentUser.role?.name;
    const ratingOwnerRole = rating.user?.role?.name;

    const hasModerationPermission =
      (currentUserRole === 'admin' || currentUserRole === 'superadmin') &&
      currentUser.admin?.moderation_permission;

    // Lógica de permisos detallada:
    if (!isOwner) {
      // Si no es el propietario
      if (!hasModerationPermission) {
        // Y no tiene permiso de moderación
        this.logger.warn(
          `remove(): Usuario ${currentUser.auth0_id} no autorizado (no propietario y sin permiso de moderación) para eliminar la calificación ${id}.`,
        );
        throw new ForbiddenException(
          'No tienes permisos para eliminar esta calificación.',
        );
      }

      // Si tiene permiso de moderación, verificar jerarquía
      if (
        currentUserRole === 'admin' && // Si el usuario actual es un admin
        ratingOwnerRole === 'superadmin' // Y el dueño de la calificación es un superadmin
      ) {
        this.logger.warn(
          `remove(): Admin ${currentUser.auth0_id} intentó eliminar calificación de Superadmin ${rating.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede eliminar calificaciones de superadministradores.',
        );
      }
    }

    // Si llegó hasta aquí, el usuario tiene permiso para eliminar
    await this.ratingRepository.delete(id);
    this.logger.log(
      `remove(): Calificación con ID "${id}" eliminada exitosamente por usuario ${currentUser.auth0_id}.`,
    );
  }
}
