import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentDto } from './dto/comment.dto';
import { plainToInstance } from 'class-transformer';
import { Comment } from './entities/comment.entity';
import { CommentRepository } from './comments.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { User } from 'src/user/entities/user.entity'; // Importar la entidad User

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async create(
    userId: string, // auth0_id del usuario creador
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    this.logger.debug(`create(): Creando comentario para usuario ${userId}.`);
    const { title_id, chapter_id, comment_text } = createCommentDto;

    if (!title_id) {
      throw new BadRequestException(
        'title_id debe ser proporcionado para un comentario.',
      );
    }

    const existingTitle = await this.titleRepository.findOneById(title_id);
    if (!existingTitle) {
      throw new NotFoundException(`Título con ID "${title_id}" no encontrado.`);
    }

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
    }

    const newComment = this.commentRepository.create({
      user_id: userId,
      title_id,
      chapter_id: chapter_id || null,
      comment_text,
    });

    const savedComment = await this.commentRepository.save(newComment);
    this.logger.log(
      `create(): Comentario (ID: ${savedComment.comment_id}) creado por usuario ${userId}.`,
    );
    return plainToInstance(CommentDto, savedComment);
  }

  async findAllByTitle(titleId: string): Promise<CommentDto[]> {
    this.logger.debug(
      `findAllByTitle(): Buscando comentarios para título con ID: ${titleId}.`,
    );
    const comments = await this.commentRepository.findAllByTitleId(titleId);
    if (!comments || comments.length === 0) {
      this.logger.warn(
        `findAllByTitle(): No se encontraron comentarios para el título "${titleId}".`,
      );
    }
    return plainToInstance(CommentDto, comments);
  }

  async findAllByChapter(chapterId: string): Promise<CommentDto[]> {
    this.logger.debug(
      `findAllByChapter(): Buscando comentarios para capítulo con ID: ${chapterId}.`,
    );
    const comments = await this.commentRepository.findAllByChapterId(chapterId);
    if (!comments || comments.length === 0) {
      this.logger.warn(
        `findAllByChapter(): No se encontraron comentarios para el capítulo "${chapterId}".`,
      );
    }
    return plainToInstance(CommentDto, comments);
  }

  async findOne(id: string): Promise<CommentDto> {
    this.logger.debug(`findOne(): Buscando comentario con ID: ${id}.`);
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) {
      this.logger.warn(`findOne(): Comentario con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }
    return plainToInstance(CommentDto, comment);
  }

  async update(
    id: string,
    currentUser: User, // Recibe el objeto User completo del usuario autenticado
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    this.logger.debug(
      `update(): Actualizando comentario con ID: ${id} por usuario ${currentUser.auth0_id}.`,
    );
    // Necesitamos cargar el comentario con su relación 'user' para verificar el rol del dueño
    // El findOneById del CommentRepository ya carga 'comment.user', 'comment.title', 'comment.chapter'
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) {
      this.logger.warn(
        `update(): Comentario con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }

    const isOwner = comment.user_id === currentUser.auth0_id;
    const currentUserRole = currentUser.role?.name; // 'admin', 'superadmin', 'Registrado', 'Suscrito'
    const commentOwnerRole = comment.user?.role?.name; // Rol del dueño del comentario

    const hasModerationPermission =
      (currentUserRole === 'admin' || currentUserRole === 'superadmin') &&
      currentUser.admin?.moderation_permission;

    // Lógica de permisos detallada:
    if (!isOwner) {
      // Si no es el propietario
      if (!hasModerationPermission) {
        // Y no tiene permiso de moderación
        this.logger.warn(
          `update(): Usuario ${currentUser.auth0_id} no autorizado (no propietario y sin permiso de moderación) para actualizar el comentario ${id}.`,
        );
        throw new ForbiddenException(
          'No tienes permisos para actualizar este comentario.',
        );
      }

      // Si tiene permiso de moderación, verificar jerarquía
      if (
        currentUserRole === 'admin' && // Si el usuario actual es un admin
        commentOwnerRole === 'superadmin' // Y el dueño del comentario es un superadmin
      ) {
        this.logger.warn(
          `update(): Admin ${currentUser.auth0_id} intentó actualizar comentario de Superadmin ${comment.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede modificar comentarios de superadministradores.',
        );
      }
    }

    // Si llegó hasta aquí, el usuario tiene permiso para actualizar
    if (updateCommentDto.comment_text !== undefined) {
      comment.comment_text = updateCommentDto.comment_text;
    }

    const updatedComment = await this.commentRepository.save(comment);
    this.logger.log(
      `update(): Comentario (ID: ${updatedComment.comment_id}) actualizado exitosamente por usuario ${currentUser.auth0_id}.`,
    );
    return plainToInstance(CommentDto, updatedComment);
  }

  async remove(
    id: string,
    currentUser: User, // Recibe el objeto User completo del usuario autenticado
  ): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando comentario con ID: ${id} por usuario ${currentUser.auth0_id}.`,
    );
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) {
      this.logger.warn(
        `remove(): Comentario con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }

    const isOwner = comment.user_id === currentUser.auth0_id;
    const currentUserRole = currentUser.role?.name;
    const commentOwnerRole = comment.user?.role?.name;

    const hasModerationPermission =
      (currentUserRole === 'admin' || currentUserRole === 'superadmin') &&
      currentUser.admin?.moderation_permission;

    // Lógica de permisos detallada:
    if (!isOwner) {
      // Si no es el propietario
      if (!hasModerationPermission) {
        // Y no tiene permiso de moderación
        this.logger.warn(
          `remove(): Usuario ${currentUser.auth0_id} no autorizado (no propietario y sin permiso de moderación) para eliminar el comentario ${id}.`,
        );
        throw new ForbiddenException(
          'No tienes permisos para eliminar este comentario.',
        );
      }

      // Si tiene permiso de moderación, verificar jerarquía
      if (
        currentUserRole === 'admin' && // Si el usuario actual es un admin
        commentOwnerRole === 'superadmin' // Y el dueño del comentario es un superadmin
      ) {
        this.logger.warn(
          `remove(): Admin ${currentUser.auth0_id} intentó eliminar comentario de Superadmin ${comment.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede eliminar comentarios de superadministradores.',
        );
      }
    }

    // Si llegó hasta aquí, el usuario tiene permiso para eliminar
    await this.commentRepository.delete(id);
    this.logger.log(
      `remove(): Comentario con ID "${id}" eliminado exitosamente por usuario ${currentUser.auth0_id}.`,
    );
  }
}
