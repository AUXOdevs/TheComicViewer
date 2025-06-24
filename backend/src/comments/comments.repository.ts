import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Comment } from './entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentORMRepository: Repository<Comment>,
  ) {}

  private createQueryBuilder(alias = 'comment') {
    return this.commentORMRepository.createQueryBuilder(alias);
  }

  async findAllByTitleId(titleId: string): Promise<Comment[]> {
    return this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.title', 'title')
      .where('comment.title_id = :titleId', { titleId })
      .orderBy('comment.comment_date', 'DESC')
      .getMany();
  }

  async findAllByChapterId(chapterId: string): Promise<Comment[]> {
    return this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.chapter', 'chapter')
      .where('comment.chapter_id = :chapterId', { chapterId })
      .orderBy('comment.comment_date', 'DESC')
      .getMany();
  }

  async findOneById(commentId: string): Promise<Comment | null> {
    return this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.title', 'title')
      .leftJoinAndSelect('comment.chapter', 'chapter')
      .where('comment.comment_id = :commentId', { commentId })
      .getOne();
  }

  create(commentPartial: Partial<Comment>): Comment {
    return this.commentORMRepository.create(commentPartial);
  }

  async save(comment: Comment): Promise<Comment> {
    return this.commentORMRepository.save(comment);
  }

  async delete(commentId: string): Promise<void> {
    await this.commentORMRepository.delete(commentId);
  }
}
