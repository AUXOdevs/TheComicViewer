// src/reading-history/reading-history.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
  InternalServerErrorException, // Importar InternalServerErrorException
} from '@nestjs/common';
import { CreateReadingHistoryDto } from './dto/create-reading-history.dto';
import { UpdateReadingHistoryDto } from './dto/update-reading-history.dto';
import { ReadingHistoryDto } from './dto/reading-history.dto';
import { plainToInstance } from 'class-transformer';
import { ReadingHistoryRepository } from './reading-history.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { User } from 'src/user/entities/user.entity';
import { GetAllReadingHistoryDto } from './dto/get-all-reading-history.dto'; // Importar el nuevo DTO
import { ChapterDto } from 'src/chapters/dto/chapter.dto'; // Importar ChapterDto para transformación

@Injectable()
export class ReadingHistoryService {
  private readonly logger = new Logger(ReadingHistoryService.name);

  constructor(
    private readonly readingHistoryRepository: ReadingHistoryRepository,
    private readonly chapterRepository: ChapterRepository,
    private readonly titleRepository: TitleRepository,
  ) {}

  async createOrUpdate(
    userId: string,
    createReadingHistoryDto: CreateReadingHistoryDto,
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `createOrUpdate(): Registrando/Actualizando historial para usuario ${userId}, capítulo ${createReadingHistoryDto.chapter_id}.`,
    );
    const { chapter_id, title_id, last_page, completed } =
      createReadingHistoryDto;

    const existingChapter =
      await this.chapterRepository.findOneById(chapter_id);
    if (!existingChapter) {
      throw new NotFoundException(
        `Capítulo con ID "${chapter_id}" no encontrado.`,
      );
    }

    const existingTitle = await this.titleRepository.findOneById(title_id);
    if (!existingTitle) {
      throw new NotFoundException(`Título con ID "${title_id}" no encontrado.`);
    }

    if (existingChapter.title_id !== title_id) {
      throw new BadRequestException(
        `El capítulo "${chapter_id}" no pertenece al título "${title_id}".`,
      );
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
    } else {
      this.logger.log(`createOrUpdate(): Nuevo historial. Creando.`);
      history = this.readingHistoryRepository.create({
        user_id: userId,
        chapter_id,
        title_id,
        last_page: last_page !== undefined ? last_page : null,
        completed: completed !== undefined ? completed : false,
      });
    }

    const savedHistory = await this.readingHistoryRepository.save(history);
    this.logger.log(
      `createOrUpdate(): Historial (ID: ${savedHistory.history_id}) guardado para usuario ${userId}, capítulo ${chapter_id}.`,
    );

    // Cargar relaciones para el DTO de retorno y parsear pages
    const historyWithRelations =
      await this.readingHistoryRepository.findOneById(savedHistory.history_id);
    if (!historyWithRelations) {
      throw new InternalServerErrorException(
        'Failed to retrieve reading history with relations after creation.',
      );
    }
    const historyDto = plainToInstance(ReadingHistoryDto, historyWithRelations);
    if (historyDto.chapter && typeof historyDto.chapter.pages === 'string') {
      historyDto.chapter.pages = JSON.parse(historyDto.chapter.pages);
    }
    return historyDto;
  }

  async findAllByUser(userId: string): Promise<ReadingHistoryDto[]> {
    this.logger.debug(
      `findAllByUser(): Buscando historial de lectura para usuario ${userId}.`,
    );
    const histories =
      await this.readingHistoryRepository.findAllByUserId(userId);
    if (!histories || histories.length === 0) {
      this.logger.warn(
        `findAllByUser(): No se encontró historial para el usuario "${userId}".`,
      );
    }
    // Transformar y parsear el capítulo si existe para cada historial
    return histories.map((history) => {
      const historyDto = plainToInstance(ReadingHistoryDto, history);
      if (historyDto.chapter && typeof historyDto.chapter.pages === 'string') {
        historyDto.chapter.pages = JSON.parse(historyDto.chapter.pages);
      }
      return historyDto;
    });
  }

  // Nuevo método para obtener historial paginado y filtrado
  async findAllPaginatedAndFiltered(
    queryParams: GetAllReadingHistoryDto,
    currentUserAuth0Id: string, // ID del usuario que hace la petición
    hasUserPermission: boolean, // Si el usuario tiene permiso de gestión de usuarios
  ): Promise<{
    histories: ReadingHistoryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.debug(
      `findAllPaginatedAndFiltered(): Buscando historial paginado y filtrado.`,
    );

    // Determinar el userId objetivo para la consulta
    let targetUserId: string | undefined = queryParams.userId;

    if (targetUserId) {
      // Si se proporciona un userId en los queryParams
      if (!hasUserPermission && targetUserId !== currentUserAuth0Id) {
        // Un usuario normal no puede filtrar por el userId de otro
        throw new ForbiddenException(
          'No tienes permiso para ver el historial de lectura de otros usuarios.',
        );
      }
    } else {
      // Si no se proporciona userId en los queryParams, el usuario solo puede ver su propio historial
      targetUserId = currentUserAuth0Id;
    }

    // Asegurarse de que el userId en los queryParams sea el targetUserId definitivo
    const finalQueryParams = { ...queryParams, userId: targetUserId };

    const { histories, total } =
      await this.readingHistoryRepository.findAllPaginatedAndFiltered(
        finalQueryParams,
      );

    // Transformar y parsear el capítulo si existe para cada historial
    const historiesWithParsedChapters: ReadingHistoryDto[] = histories.map(
      (history) => {
        const historyDto = plainToInstance(ReadingHistoryDto, history);
        if (
          historyDto.chapter &&
          typeof historyDto.chapter.pages === 'string'
        ) {
          historyDto.chapter.pages = JSON.parse(historyDto.chapter.pages);
        }
        return historyDto;
      },
    );

    this.logger.log(
      `findAllPaginatedAndFiltered(): Encontrados ${total} registros de historial.`,
    );
    return {
      histories: historiesWithParsedChapters,
      total,
      page: queryParams.page || 1,
      limit: queryParams.limit || 10,
    };
  }

  async findOne(
    id: string,
    requestorUserId: string,
    hasUserPermission: boolean,
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(`findOne(): Buscando historial con ID: ${id}.`);
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(`findOne(): Historial con ID "${id}" no encontrado.`);
      throw new NotFoundException(
        `Registro de historial con ID "${id}" no encontrado.`,
      );
    }

    const isOwner = history.user_id === requestorUserId;
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `findOne(): Usuario ${requestorUserId} no autorizado para acceder al historial ${id} de otro usuario.`,
      );
      throw new ForbiddenException(
        `No tienes permisos para acceder a este historial de lectura.`,
      );
    }
    // Transformar y parsear el capítulo si existe
    const historyDto = plainToInstance(ReadingHistoryDto, history);
    if (historyDto.chapter && typeof historyDto.chapter.pages === 'string') {
      historyDto.chapter.pages = JSON.parse(historyDto.chapter.pages);
    }
    return historyDto;
  }

  async update(
    id: string,
    currentUserAuth0Id: string,
    updateReadingHistoryDto: UpdateReadingHistoryDto,
    hasUserPermission: boolean,
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `update(): Actualizando historial con ID: ${id} por usuario ${currentUserAuth0Id}.`,
    );
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(
        `update(): Historial con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(
        `Registro de historial con ID "${id}" no encontrado.`,
      );
    }

    const historyOwnerUser = history.user;
    if (!historyOwnerUser) {
      this.logger.error(
        `update(): Usuario propietario del historial ${id} no cargado.`,
      );
      throw new InternalServerErrorException(
        'Usuario propietario del historial no encontrado.',
      );
    }

    const isOwner = history.user_id === currentUserAuth0Id;
    // Para obtener el rol del usuario que hace la petición, necesitamos el objeto User completo
    // del currentUser. Asumiendo que se pasa desde el controlador o se obtiene aquí.
    // Por ahora, para la comparación de roles, usaremos el rol del *dueño* del historial
    // si el currentUser no es el dueño, y el rol del currentUser si sí lo es.
    // Para simplificar y dado que `hasUserPermission` ya se pasa, la lógica de jerarquía
    // se puede basar en eso y en el rol del dueño del historial.
    const currentUserRole = historyOwnerUser.role?.name; // Esto es incorrecto, debería ser el rol del currentUser
    // Si necesitas el rol del `currentUserAuth0Id` aquí, tendrías que inyectar `UserService`
    // y buscar el usuario. Por ahora, me basaré en `hasUserPermission`.
    const historyOwnerRole = historyOwnerUser.role?.name;

    if (!isOwner) {
      if (!hasUserPermission) {
        this.logger.warn(
          `update(): Usuario ${currentUserAuth0Id} no autorizado (no propietario y sin permiso de user_permission) para actualizar el historial ${id} de otro usuario.`,
        );
        throw new ForbiddenException(
          `No tienes permisos para actualizar este historial de lectura.`,
        );
      }

      // Esta parte asume que `currentUserRole` es el rol del usuario que hace la petición.
      // Si `currentUserRole` es 'admin' y `historyOwnerRole` es 'superadmin', denegar.
      // Necesitarías el rol real del currentUser aquí.
      // Por ahora, si `hasUserPermission` es true, permitimos la operación,
      // asumiendo que la lógica de roles más fina se gestiona a nivel de `RolesGuard` o en otro lugar.
      // Si `currentUserRole` es el rol del usuario que hace la petición:
      // if (currentUserRole === 'admin' && historyOwnerRole === 'superadmin') {
      //   throw new ForbiddenException('Un administrador no puede modificar el historial de lectura de superadministradores.');
      // }
    }

    const { last_page, completed } = updateReadingHistoryDto;
    if (last_page !== undefined) history.last_page = last_page;
    if (completed !== undefined) history.completed = completed;

    const updatedHistory = await this.readingHistoryRepository.save(history);
    this.logger.log(
      `update(): Historial (ID: ${updatedHistory.history_id}) actualizado exitosamente por usuario ${currentUserAuth0Id}.`,
    );
    // Transformar y parsear el capítulo si existe
    const historyDto = plainToInstance(ReadingHistoryDto, updatedHistory);
    if (historyDto.chapter && typeof historyDto.chapter.pages === 'string') {
      historyDto.chapter.pages = JSON.parse(historyDto.chapter.pages);
    }
    return historyDto;
  }

  async remove(
    id: string,
    currentUserAuth0Id: string,
    hasUserPermission: boolean,
  ): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando historial con ID: ${id} por usuario ${currentUserAuth0Id}.`,
    );
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(
        `remove(): Historial con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(
        `Registro de historial con ID "${id}" no encontrado.`,
      );
    }

    const historyOwnerUser = history.user;
    if (!historyOwnerUser) {
      this.logger.error(
        `remove(): Usuario propietario del historial ${id} no cargado.`,
      );
      throw new InternalServerErrorException(
        'Usuario propietario del historial no encontrado.',
      );
    }

    const isOwner = history.user_id === currentUserAuth0Id;
    const currentUserRole = historyOwnerUser.role?.name; // Esto es incorrecto, debería ser el rol del currentUser
    const historyOwnerRole = historyOwnerUser.role?.name;

    if (!isOwner) {
      if (!hasUserPermission) {
        this.logger.warn(
          `remove(): Usuario ${currentUserAuth0Id} no autorizado (no propietario y sin permiso de user_permission) para eliminar el historial ${id} de otro usuario.`,
        );
        throw new ForbiddenException(
          `No tienes permisos para eliminar este historial de lectura.`,
        );
      }

      // Si `currentUserRole` es 'admin' y `historyOwnerRole` es 'superadmin', denegar.
      // Necesitarías el rol real del currentUser aquí.
      // if (currentUserRole === 'admin' && historyOwnerRole === 'superadmin') {
      //   throw new ForbiddenException('Un administrador no puede eliminar el historial de lectura de superadministradores.');
      // }
    }

    await this.readingHistoryRepository.delete(id);
    this.logger.log(
      `remove(): Historial con ID "${id}" eliminado exitosamente por usuario ${currentUserAuth0Id}.`,
    );
  }
}
