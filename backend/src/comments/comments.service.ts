import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
    const { title_id, chapter_id, content } = createCommentDto;

    if (!title_id) {
      throw new BadRequestException('title_id must be provided for a comment.');
    }
    const existingTitle = await this.titleRepository.findOneById(title_id);
    if (!existingTitle) {
      throw new NotFoundException(`Title with ID "${title_id}" not found.`);
    }

    if (chapter_id) {
      const existingChapter =
        await this.chapterRepository.findOneById(chapter_id);
      if (!existingChapter) {
        throw new NotFoundException(
          `Chapter with ID "${chapter_id}" not found.`,
        );
      }
      // Opcional: Podrías añadir validación de que el capítulo pertenece al título
      if (existingChapter.title_id !== title_id) {
        throw new BadRequestException(
          'Chapter does not belong to the specified title.',
        );
      }
    }

    const newComment = this.commentRepository.create({
      user_id: userId,
      title_id,
      chapter_id: chapter_id || null,
      content,
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
    return plainToInstance(CommentDto, comments);
  }

  async findAllByChapter(chapterId: string): Promise<CommentDto[]> {
    this.logger.debug(
      `findAllByChapter(): Buscando comentarios para capítulo con ID: ${chapterId}.`,
    );
    const comments = await this.commentRepository.findAllByChapterId(chapterId);
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
    userId: string,
    updateCommentDto: UpdateCommentDto,
    isAdmin: boolean,
  ): Promise<CommentDto> {
    this.logger.debug(
      `update(): Actualizando comentario con ID: ${id} por usuario ${userId}.`,
    );
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) {
      this.logger.warn(
        `update(): Comentario con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }

    // Solo el dueño del comentario o un admin pueden actualizar
    if (comment.user_id !== userId && !isAdmin) {
      this.logger.warn(
        `update(): Usuario ${userId} no autorizado para actualizar el comentario ${id}.`,
      );
      throw new BadRequestException(
        'You are not authorized to update this comment.',
      );
    }

    Object.assign(comment, updateCommentDto);
    const updatedComment = await this.commentRepository.save(comment);
    this.logger.log(
      `update(): Comentario (ID: ${updatedComment.comment_id}) actualizado exitosamente.`,
    );
    return plainToInstance(CommentDto, updatedComment);
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando comentario con ID: ${id} por usuario ${userId}.`,
    );
    const comment = await this.commentRepository.findOneById(id);
    if (!comment) {
      this.logger.warn(
        `remove(): Comentario con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }

    // Solo el dueño del comentario o un admin pueden eliminar
    if (comment.user_id !== userId && !isAdmin) {
      this.logger.warn(
        `remove(): Usuario ${userId} no autorizado para eliminar el comentario ${id}.`,
      );
      throw new BadRequestException(
        'You are not authorized to delete this comment.',
      );
    }

    await this.commentRepository.delete(id);
    this.logger.log(
      `remove(): Comentario con ID "${id}" eliminado exitosamente.`,
    );
  }
}
