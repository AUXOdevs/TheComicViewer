// src/comments/comments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException, // Importar InternalServerErrorException
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentDto } from './dto/comment.dto';
import { plainToInstance } from 'class-transformer';
import { Comment } from './entities/comment.entity';
import { CommentRepository } from './comments.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { User } from 'src/user/entities/user.entity';
import { GetAllCommentsDto, OrderDirection } from './dto/get-all-comments.dto'; // Importar el nuevo DTO y enum
import { ChapterDto } from 'src/chapters/dto/chapter.dto'; // Importar ChapterDto para transformación

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async create(
    userId: string,
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

    // Para asegurar que las relaciones se carguen para el DTO de retorno
    const commentWithRelations = await this.commentRepository.findOneById(
      savedComment.comment_id,
    );
    if (!commentWithRelations) {
      throw new InternalServerErrorException(
        'Failed to retrieve comment with relations after creation.',
      );
    }

    // Transformar y parsear el capítulo si existe
    const commentDto = plainToInstance(CommentDto, commentWithRelations);
    if (commentDto.chapter && typeof commentDto.chapter.pages === 'string') {
      commentDto.chapter.pages = JSON.parse(commentDto.chapter.pages);
    }
    return commentDto;
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
    // Transformar y parsear el capítulo si existe para cada comentario
    return comments.map((comment) => {
      const commentDto = plainToInstance(CommentDto, comment);
      if (commentDto.chapter && typeof commentDto.chapter.pages === 'string') {
        commentDto.chapter.pages = JSON.parse(commentDto.chapter.pages);
      }
      return commentDto;
    });
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
    // Transformar y parsear el capítulo si existe para cada comentario
    return comments.map((comment) => {
      const commentDto = plainToInstance(CommentDto, comment);
      if (commentDto.chapter && typeof commentDto.chapter.pages === 'string') {
        commentDto.chapter.pages = JSON.parse(commentDto.chapter.pages);
      }
      return commentDto;
    });
  }

  // Nuevo método para obtener comentarios paginados y filtrados
  async findAllPaginatedAndFiltered(
    queryParams: GetAllCommentsDto,
  ): Promise<{
    comments: CommentDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.debug(
      `findAllPaginatedAndFiltered(): Buscando comentarios paginados y filtrados.`,
    );

    const { comments, total } =
      await this.commentRepository.findAllPaginatedAndFiltered(queryParams);

    // Transformar y parsear el capítulo si existe para cada comentario
    const commentsWithParsedChapters: CommentDto[] = comments.map((comment) => {
      const commentDto = plainToInstance(CommentDto, comment);
      if (commentDto.chapter && typeof commentDto.chapter.pages === 'string') {
        commentDto.chapter.pages = JSON.parse(commentDto.chapter.pages);
      }
      return commentDto;
    });

    this.logger.log(
      `findAllPaginatedAndFiltered(): Encontrados ${total} comentarios.`,
    );
    return {
      comments: commentsWithParsedChapters,
      total,
      page: queryParams.page || 1,
      limit: queryParams.limit || 10,
    };
  }

  async findOne(id: string): Promise<CommentDto> {
    this.logger.debug(`findOne(): Buscando comentario con ID: ${id}.`);
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) {
      this.logger.warn(`findOne(): Comentario con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }
    // Transformar y parsear el capítulo si existe
    const commentDto = plainToInstance(CommentDto, comment);
    if (commentDto.chapter && typeof commentDto.chapter.pages === 'string') {
      commentDto.chapter.pages = JSON.parse(commentDto.chapter.pages);
    }
    return commentDto;
  }

  async update(
    id: string,
    currentUser: User,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    this.logger.debug(
      `update(): Actualizando comentario con ID: ${id} por usuario ${currentUser.auth0_id}.`,
    );
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) {
      this.logger.warn(
        `update(): Comentario con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }

    const isOwner = comment.user_id === currentUser.auth0_id;
    const currentUserRole = currentUser.role?.name;
    const commentOwnerRole = comment.user?.role?.name;

    const hasModerationPermission =
      (currentUserRole === 'admin' || currentUserRole === 'superadmin') &&
      currentUser.admin?.moderation_permission;

    if (!isOwner) {
      if (!hasModerationPermission) {
        this.logger.warn(
          `update(): Usuario ${currentUser.auth0_id} no autorizado (no propietario y sin permiso de moderación) para actualizar el comentario ${id}.`,
        );
        throw new ForbiddenException(
          'No tienes permisos para actualizar este comentario.',
        );
      }

      if (currentUserRole === 'admin' && commentOwnerRole === 'superadmin') {
        this.logger.warn(
          `update(): Admin ${currentUser.auth0_id} intentó actualizar comentario de Superadmin ${comment.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede modificar comentarios de superadministradores.',
        );
      }
    }

    if (updateCommentDto.comment_text !== undefined) {
      comment.comment_text = updateCommentDto.comment_text;
    }

    const updatedComment = await this.commentRepository.save(comment);
    this.logger.log(
      `update(): Comentario (ID: ${updatedComment.comment_id}) actualizado exitosamente por usuario ${currentUser.auth0_id}.`,
    );
    // Transformar y parsear el capítulo si existe
    const commentDto = plainToInstance(CommentDto, updatedComment);
    if (commentDto.chapter && typeof commentDto.chapter.pages === 'string') {
      commentDto.chapter.pages = JSON.parse(commentDto.chapter.pages);
    }
    return commentDto;
  }

  async remove(id: string, currentUser: User): Promise<void> {
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

    if (!isOwner) {
      if (!hasModerationPermission) {
        this.logger.warn(
          `remove(): Usuario ${currentUser.auth0_id} no autorizado (no propietario y sin permiso de moderación) para eliminar el comentario ${id}.`,
        );
        throw new ForbiddenException(
          'No tienes permisos para eliminar este comentario.',
        );
      }

      if (currentUserRole === 'admin' && commentOwnerRole === 'superadmin') {
        this.logger.warn(
          `remove(): Admin ${currentUser.auth0_id} intentó eliminar comentario de Superadmin ${comment.user_id}. Acceso denegado.`,
        );
        throw new ForbiddenException(
          'Un administrador no puede eliminar comentarios de superadministradores.',
        );
      }
    }

    await this.commentRepository.delete(id);
    this.logger.log(
      `remove(): Comentario con ID "${id}" eliminado exitosamente por usuario ${currentUser.auth0_id}.`,
    );
  }
}
