import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
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
    userId: string,
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
        user_id: userId,
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
    return plainToInstance(ReadingHistoryDto, histories);
  }

  async findOne(id: string, userId: string): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `findOne(): Buscando historial con ID: ${id} para usuario ${userId}.`,
    );
    const history = await this.readingHistoryRepository.findOneById(id); // <-- CAMBIO CLAVE
    if (!history) {
      this.logger.warn(`findOne(): Historial con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Reading history with ID "${id}" not found.`);
    }
    if (history.user_id !== userId) {
      this.logger.warn(
        `findOne(): Usuario ${userId} intentó acceder al historial ${id} de otro usuario.`,
      );
      throw new BadRequestException(
        `Reading history with ID "${id}" does not belong to user ${userId}.`,
      );
    }
    return plainToInstance(ReadingHistoryDto, history);
  }

  async update(
    id: string,
    userId: string,
    updateReadingHistoryDto: UpdateReadingHistoryDto,
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `update(): Actualizando historial con ID: ${id} por usuario ${userId}.`,
    );
    const history = await this.readingHistoryRepository.findOneById(id); // <-- CAMBIO CLAVE
    if (!history) {
      this.logger.warn(
        `update(): Historial con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Reading history with ID "${id}" not found.`);
    }
    if (history.user_id !== userId) {
      this.logger.warn(
        `update(): Usuario ${userId} no autorizado para actualizar el historial ${id}.`,
      );
      throw new BadRequestException(
        `Reading history with ID "${id}" does not belong to user ${userId}.`,
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

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando historial con ID: ${id} por usuario ${userId}.`,
    );
    const history = await this.readingHistoryRepository.findOneById(id); // <-- CAMBIO CLAVE
    if (!history) {
      this.logger.warn(
        `remove(): Historial con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Reading history with ID "${id}" not found.`);
    }
    if (history.user_id !== userId && !isAdmin) {
      this.logger.warn(
        `remove(): Usuario ${userId} no autorizado para eliminar el historial ${id}.`,
      );
      throw new BadRequestException(
        `Reading history with ID "${id}" does not belong to user ${userId}.`,
      );
    }
    await this.readingHistoryRepository.delete(id);
    this.logger.log(
      `remove(): Historial con ID "${id}" eliminado exitosamente.`,
    );
  }
}
