import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { CreateReadingHistoryDto } from './dto/create-reading-history.dto';
import { UpdateReadingHistoryDto } from './dto/update-reading-history.dto';
import { ReadingHistoryDto } from './dto/reading-history.dto';
import { plainToInstance } from 'class-transformer';
import { ReadingHistoryRepository } from './reading-history.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { TitleRepository } from 'src/titles/titles.repository'; // Importar TitleRepository
import { User } from 'src/user/entities/user.entity'; // Importar la entidad User

@Injectable()
export class ReadingHistoryService {
  private readonly logger = new Logger(ReadingHistoryService.name);

  constructor(
    private readonly readingHistoryRepository: ReadingHistoryRepository,
    private readonly chapterRepository: ChapterRepository,
    private readonly titleRepository: TitleRepository, // Inyectar TitleRepository
  ) {}

  async createOrUpdate(
    userId: string, // Este userId es el usuario REAL para quien se crea/actualiza el historial
    createReadingHistoryDto: CreateReadingHistoryDto,
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `createOrUpdate(): Registrando/Actualizando historial para usuario ${userId}, capítulo ${createReadingHistoryDto.chapter_id}.`,
    );
    const { chapter_id, title_id, last_page, completed } =
      createReadingHistoryDto;

    // 1. Validar existencia del capítulo
    const existingChapter =
      await this.chapterRepository.findOneById(chapter_id);
    if (!existingChapter) {
      throw new NotFoundException(
        `Capítulo con ID "${chapter_id}" no encontrado.`,
      );
    }

    // 2. Validar existencia del título (opcional, pero buena para la integridad de datos)
    const existingTitle = await this.titleRepository.findOneById(title_id);
    if (!existingTitle) {
      throw new NotFoundException(`Título con ID "${title_id}" no encontrado.`);
    }

    // 3. Asegurar que el capítulo pertenece al título proporcionado
    if (existingChapter.title_id !== title_id) {
      throw new BadRequestException(
        `El capítulo "${chapter_id}" no pertenece al título "${title_id}".`,
      );
    }

    // 4. Buscar historial existente para el usuario y capítulo
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
      // updated_at se actualiza automáticamente con @UpdateDateColumn
    } else {
      this.logger.log(`createOrUpdate(): Nuevo historial. Creando.`);
      history = this.readingHistoryRepository.create({
        user_id: userId, // Asigna el user_id proporcionado
        chapter_id,
        title_id, // Asigna el title_id
        last_page: last_page !== undefined ? last_page : null,
        completed: completed !== undefined ? completed : false,
        // access_date y updated_at son manejados por los decoradores de TypeORM
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
      this.logger.warn(
        `findAllByUser(): No se encontró historial para el usuario "${userId}".`,
      );
    }
    return plainToInstance(ReadingHistoryDto, histories);
  }

  async findOne(
    id: string,
    requestorUserId: string, // ID del usuario que hace la petición
    hasUserPermission: boolean, // Indica si el usuario tiene permiso de gestión de usuarios
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(`findOne(): Buscando historial con ID: ${id}.`);
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(`findOne(): Historial con ID "${id}" no encontrado.`);
      throw new NotFoundException(
        `Registro de historial con ID "${id}" no encontrado.`,
      );
    }

    // Lógica de autorización: solo el propietario o un admin con permiso
    const isOwner = history.user_id === requestorUserId;
    if (!isOwner && !hasUserPermission) {
      this.logger.warn(
        `findOne(): Usuario ${requestorUserId} no autorizado para acceder al historial ${id} de otro usuario.`,
      );
      throw new ForbiddenException(
        `No tienes permisos para acceder a este historial de lectura.`,
      );
    }
    return plainToInstance(ReadingHistoryDto, history);
  }

  async update(
    id: string,
    currentUserAuth0Id: string, // ID Auth0 del usuario actual haciendo la petición
    updateReadingHistoryDto: UpdateReadingHistoryDto,
    hasUserPermission: boolean, // Indica si el usuario actual tiene el permiso 'user_permission'
  ): Promise<ReadingHistoryDto> {
    this.logger.debug(
      `update(): Actualizando historial con ID: ${id} por usuario ${currentUserAuth0Id}.`,
    );
    // Cargar el historial incluyendo el usuario propietario para verificar su rol
    const history = await this.readingHistoryRepository.findOneById(id);
    if (!history) {
      this.logger.warn(
        `update(): Historial con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(
        `Registro de historial con ID "${id}" no encontrado.`,
      );
    }

    // Obtener el objeto User completo del propietario del historial para su rol
    // Nota: findOneById del repositorio ya debería cargar la relación 'user'
    const historyOwnerUser = history.user;
    if (!historyOwnerUser) {
      this.logger.error(
        `update(): Usuario propietario del historial ${id} no cargado.`,
      );
      throw new NotFoundException(
        'Usuario propietario del historial no encontrado.',
      );
    }

    const isOwner = history.user_id === currentUserAuth0Id;
    const currentUserRole = historyOwnerUser.role?.name; // Asumiendo que el rol del usuario que hace la request está en 'currentUser'
    const historyOwnerRole = historyOwnerUser.role?.name; // Rol del dueño del historial

    // Lógica de permisos detallada:
    if (!isOwner) {
      // Si no es el propietario
      if (!hasUserPermission) {
        // Y no tiene permiso de gestión de usuarios
        this.logger.warn(
          `update(): Usuario ${currentUserAuth0Id} no autorizado (no propietario y sin permiso de user_permission) para actualizar el historial ${id} de otro usuario.`,
        );
        throw new ForbiddenException(
          `No tienes permisos para actualizar este historial de lectura.`,
        );
      }

      // Si tiene permiso de gestión de usuarios, verificar jerarquía para admins
      // (Asume que el rol del usuario que hace la petición está disponible en el objeto req.user)
      // Para esta validación, necesitaríamos el objeto completo del currentUser, no solo su ID.
      // Si el rol no está directamente en el payload del JWT, necesitaríamos inyectar UserService aquí
      // y buscar el currentUser por su ID para obtener su rol.
      // Por ahora, asumiré que 'currentUser.role.name' estaría disponible de alguna manera en el controlador
      // y pasado al servicio. Si no, habría que ajustar esto.
      if (
        currentUserRole === 'admin' && // Si el usuario actual es un admin
        historyOwnerRole === 'superadmin' // Y el dueño del historial es un superadmin
      ) {
        this.logger.warn(
          `update(): Admin ${currentUserAuth0Id} intentó actualizar historial de Superadmin ${history.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede modificar el historial de lectura de superadministradores.',
        );
      }
    }

    // Si llegó hasta aquí, el usuario tiene permiso para actualizar
    const { last_page, completed } = updateReadingHistoryDto;
    if (last_page !== undefined) history.last_page = last_page;
    if (completed !== undefined) history.completed = completed;

    // updated_at se actualiza automáticamente con @UpdateDateColumn
    const updatedHistory = await this.readingHistoryRepository.save(history);
    this.logger.log(
      `update(): Historial (ID: ${updatedHistory.history_id}) actualizado exitosamente por usuario ${currentUserAuth0Id}.`,
    );
    return plainToInstance(ReadingHistoryDto, updatedHistory);
  }

  async remove(
    id: string,
    currentUserAuth0Id: string, // ID Auth0 del usuario actual haciendo la petición
    hasUserPermission: boolean, // Indica si el usuario actual tiene el permiso 'user_permission'
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

    // Obtener el objeto User completo del propietario del historial para su rol
    const historyOwnerUser = history.user;
    if (!historyOwnerUser) {
      this.logger.error(
        `remove(): Usuario propietario del historial ${id} no cargado.`,
      );
      throw new NotFoundException(
        'Usuario propietario del historial no encontrado.',
      );
    }

    const isOwner = history.user_id === currentUserAuth0Id;
    const currentUserRole = historyOwnerUser.role?.name; // Asumiendo que el rol del usuario que hace la request está en 'currentUser'
    const historyOwnerRole = historyOwnerUser.role?.name; // Rol del dueño del historial

    // Lógica de permisos detallada:
    if (!isOwner) {
      // Si no es el propietario
      if (!hasUserPermission) {
        // Y no tiene permiso de gestión de usuarios
        this.logger.warn(
          `remove(): Usuario ${currentUserAuth0Id} no autorizado (no propietario y sin permiso de user_permission) para eliminar el historial ${id} de otro usuario.`,
        );
        throw new ForbiddenException(
          `No tienes permisos para eliminar este historial de lectura.`,
        );
      }

      // Si tiene permiso de gestión de usuarios, verificar jerarquía para admins
      if (
        currentUserRole === 'admin' && // Si el usuario actual es un admin
        historyOwnerRole === 'superadmin' // Y el dueño del historial es un superadmin
      ) {
        this.logger.warn(
          `remove(): Admin ${currentUserAuth0Id} intentó eliminar historial de Superadmin ${history.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede eliminar el historial de lectura de superadministradores.',
        );
      }
    }

    await this.readingHistoryRepository.delete(id);
    this.logger.log(
      `remove(): Historial con ID "${id}" eliminado exitosamente por usuario ${currentUserAuth0Id}.`,
    );
  }
}
