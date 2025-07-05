// src/comments/comments.repository.ts
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Comment } from './entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GetAllCommentsDto, OrderDirection } from './dto/get-all-comments.dto';

@Injectable()
export class CommentRepository {
  private readonly logger = new Logger(CommentRepository.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentORMRepository: Repository<Comment>,
  ) {}

  private createQueryBuilder(alias = 'comment') {
    return this.commentORMRepository.createQueryBuilder(alias);
  }

  async findAllByTitleId(titleId: string): Promise<Comment[]> {
    this.logger.debug(
      `findAllByTitleId(): Buscando comentarios para título con ID: ${titleId}.`,
    );
    return this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.title', 'title')
      .where('comment.title_id = :titleId', { titleId })
      .orderBy('comment.comment_date', 'DESC')
      .getMany();
  }

  async findAllByChapterId(chapterId: string): Promise<Comment[]> {
    this.logger.debug(
      `findAllByChapterId(): Buscando comentarios para capítulo con ID: ${chapterId}.`,
    );
    return this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.chapter', 'chapter')
      .where('comment.chapter_id = :chapterId', { chapterId })
      .orderBy('comment.comment_date', 'DESC')
      .getMany();
  }

  async findAllPaginatedAndFiltered(
    queryParams: GetAllCommentsDto,
  ): Promise<{ comments: Comment[]; total: number }> {
    this.logger.debug(
      `findAllPaginatedAndFiltered(): Buscando comentarios paginados y filtrados con filtros: ${JSON.stringify(queryParams)}`,
    );

    const {
      page,
      limit,
      sortBy,
      order,
      userId,
      username,
      titleName,
      chapterName,
      isTitleComment,
      commentText,
    } = queryParams;

    const queryBuilder = this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.title', 'title')
      .leftJoinAndSelect('comment.chapter', 'chapter');

    // Aplicar filtros
    if (userId) {
      queryBuilder.andWhere('comment.user_id = :userId', { userId });
    }
    if (username) {
      // CORRECCIÓN: Usar 'user.name' en lugar de 'user.username'
      queryBuilder.andWhere('LOWER(user.name) LIKE LOWER(:username)', {
        username: `%${username}%`,
      });
    }
    if (titleName) {
      queryBuilder.andWhere('LOWER(title.name) LIKE LOWER(:titleName)', {
        titleName: `%${titleName}%`,
      });
    }
    if (chapterName) {
      queryBuilder.andWhere('comment.chapter_id IS NOT NULL');
      queryBuilder.andWhere('LOWER(chapter.name) LIKE LOWER(:chapterName)', {
        chapterName: `%${chapterName}%`,
      });
    }
    if (isTitleComment !== undefined) {
      if (isTitleComment) {
        queryBuilder.andWhere('comment.chapter_id IS NULL');
      } else {
        queryBuilder.andWhere('comment.chapter_id IS NOT NULL');
      }
    }
    if (commentText) {
      queryBuilder.andWhere(
        'LOWER(comment.comment_text) LIKE LOWER(:commentText)',
        { commentText: `%${commentText}%` },
      );
    }

    // Mapeo de columnas para ordenar
    const validSortColumns = {
      comment_date: 'comment.comment_date',
      // CORRECCIÓN: Usar 'user.name' para ordenar por nombre de usuario
      user_username: 'user.name',
      title_name: 'title.name',
      chapter_number: 'chapter.chapter_number',
    };

    const actualSortBy = validSortColumns[sortBy] || 'comment.comment_date';
    queryBuilder.orderBy(actualSortBy, order || OrderDirection.DESC);

    const [comments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { comments, total };
  }

  async findOneById(commentId: string): Promise<Comment | null> {
    this.logger.debug(
      `findOneById(): Buscando comentario con ID: ${commentId}.`,
    );
    return this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.title', 'title')
      .leftJoinAndSelect('comment.chapter', 'chapter')
      .where('comment.comment_id = :commentId', { commentId })
      .getOne();
  }

  create(commentPartial: Partial<Comment>): Comment {
    this.logger.debug(`create(): Creando entidad de comentario en memoria.`);
    return this.commentORMRepository.create(commentPartial);
  }

  async save(comment: Comment): Promise<Comment> {
    this.logger.debug(
      `save(): Guardando entidad de comentario en la base de datos.`,
    );
    return this.commentORMRepository.save(comment);
  }

  async delete(commentId: string): Promise<void> {
    this.logger.debug(`delete(): Eliminando comentario con ID: ${commentId}.`);
    await this.commentORMRepository.delete(commentId);
  }
}
