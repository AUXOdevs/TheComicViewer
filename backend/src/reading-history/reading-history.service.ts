import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException, // Asegúrate de importar ForbiddenException
} from '@nestjs/common';
import { CreateReadingHistoryDto } from './dto/create-reading-history.dto';
import { UpdateReadingHistoryDto } from './dto/update-reading-history.dto';
import { ReadingHistoryDto } from './dto/reading-history.dto';
import { plainToInstance } from 'class-transformer';
import { ReadingHistoryRepository } from './reading-history.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';

@Injectable()
export class ReadingHistoryService {
  private readonly logger = new Logger(ReadingHistoryService.name);

  constructor(
    private readonly readingHistoryRepository: ReadingHistoryRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async createOrUpdate(
    userId: string, // Este userId es el usuario REAL para quien se crea/actualiza el historial
    createReadingHistoryDto: CreateReadingHistoryDto,
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `createOrUpdate(): Registrando/Actualizando historial para usuario ${userId}, capítulo ${createReadingHistoryDto.chapter_id}.`,
    );
    const { chapter_id, last_page, completed } = createReadingHistoryDto;

    const existingChapter =
      await this.chapterRepository.findOneById(chapter_id);
    if (!existingChapter) {
      throw new NotFoundException(`Chapter with ID "${chapter_id}" not found.`);
    }

    let history =
      await this.readingHistoryRepository.findOneByUserIdAndChapterId(
        userId,
        chapter_id,
      );

    if (history) {
      this.logger.debug(
        `createOrUpdate(): Historial existente encontrado. Actualizando.`,
      );
      history.last_page =
        last_page !== undefined ? last_page : history.last_page;
      history.completed =
        completed !== undefined ? completed : history.completed;
      history.updated_at = new Date();
    } else {
      this.logger.log(`createOrUpdate(): Nuevo historial. Creando.`);
      history = this.readingHistoryRepository.create({
        user_id: userId, // Asigna el user_id proporcionado
        chapter_id,
        last_page: last_page !== undefined ? last_page : null,
        completed: completed !== undefined ? completed : false,
        access_date: new Date(),
        updated_at: new Date(),
      });
    }

    const savedHistory = await this.readingHistoryRepository.save(history);
    this.logger.log(
      `createOrUpdate(): Historial (ID: ${savedHistory.history_id}) guardado para usuario ${userId}, capítulo ${chapter_id}.`,
    );
    return plainToInstance(ReadingHistoryDto, savedHistory);
  }

  async findAllByUser(userId: string): Promise<ReadingHistoryDto[]> {
    this.logger.debug(
      `findAllByUser(): Buscando historial de lectura para usuario ${userId}.`,
    );
    const histories =
      await this.readingHistoryRepository.findAllByUserId(userId);
    if (!histories || histories.length === 0) {
      // Opcional: log/excepción si no hay historial
      this.logger.warn(
        `findAllByUser(): No se encontró historial para el usuario "${userId}".`,
      );
    }
    return plainToInstance(ReadingHistoryDto, histories);
  }

  async findOne(
    id: string,
    requestorUserId: string,
    hasUserPermission: boolean,
  ): Promise<ReadingHistoryDto> {
    // <-- Nuevo parámetro hasUserPermission
    this.logger.debug(`findOne(): Buscando historial con ID: ${id}.`);
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(`findOne(): Historial con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Reading history with ID "${id}" not found.`);
    }

    // Lógica de autorización: el propietario o un admin con permiso
    const isOwner = history.user_id === requestorUserId;
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `findOne(): Usuario ${requestorUserId} no autorizado para acceder al historial ${id} de otro usuario.`,
      );
      throw new ForbiddenException( // <-- Usar ForbiddenException
        `No tienes permisos para acceder a este historial de lectura.`,
      );
    }
    return plainToInstance(ReadingHistoryDto, history);
  }

  async update(
    id: string,
    requestorUserId: string, // <-- Nombre más claro para el ID del usuario que hace la petición
    updateReadingHistoryDto: UpdateReadingHistoryDto,
    hasUserPermission: boolean, // <-- Nuevo parámetro
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `update(): Actualizando historial con ID: ${id} por usuario ${requestorUserId}.`,
    );
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(
        `update(): Historial con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Reading history with ID "${id}" not found.`);
    }

    // Lógica de autorización: el propietario o un admin con permiso
    const isOwner = history.user_id === requestorUserId;
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `update(): Usuario ${requestorUserId} no autorizado para actualizar el historial ${id} de otro usuario.`,
      );
      throw new ForbiddenException( // <-- Usar ForbiddenException
        `No tienes permisos para actualizar este historial de lectura.`,
      );
    }

    const { last_page, completed } = updateReadingHistoryDto;
    if (last_page !== undefined) history.last_page = last_page;
    if (completed !== undefined) history.completed = completed;

    history.updated_at = new Date();

    const updatedHistory = await this.readingHistoryRepository.save(history);
    this.logger.log(
      `update(): Historial (ID: ${updatedHistory.history_id}) actualizado exitosamente.`,
    );
    return plainToInstance(ReadingHistoryDto, updatedHistory);
  }

  async remove(
    id: string,
    requestorUserId: string,
    hasUserPermission: boolean,
  ): Promise<void> {
    // <-- Nombre más claro y nuevo parámetro
    this.logger.debug(
      `remove(): Eliminando historial con ID: ${id} por usuario ${requestorUserId}.`,
    );
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(
        `remove(): Historial con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Reading history with ID "${id}" not found.`);
    }

    // Lógica de autorización: el propietario o un admin con permiso
    const isOwner = history.user_id === requestorUserId;
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `remove(): Usuario ${requestorUserId} no autorizado para eliminar el historial ${id} de otro usuario.`,
      );
      throw new ForbiddenException( // <-- Usar ForbiddenException
        `No tienes permisos para eliminar este historial de lectura.`,
      );
    }

    await this.readingHistoryRepository.delete(id);
    this.logger.log(
      `remove(): Historial con ID "${id}" eliminado exitosamente.`,
    );
  }
}
