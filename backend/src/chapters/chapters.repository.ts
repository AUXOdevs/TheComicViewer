import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';

@Injectable()
export class ChapterRepository {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterORMRepository: Repository<Chapter>,
  ) {}

  private createQueryBuilder(alias = 'chapter') {
    return this.chapterORMRepository.createQueryBuilder(alias);
  }

  async findAllByTitleId(titleId: string): Promise<Chapter[]> {
    return this.createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.title', 'title')
      .where('chapter.title_id = :titleId', { titleId })
      .orderBy('chapter.chapter_number', 'ASC') // Ordenar capítulos por número
      .getMany();
  }

  async findOneById(chapterId: string): Promise<Chapter | null> {
    return this.createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.title', 'title')
      .where('chapter.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  create(chapterPartial: Partial<Chapter>): Chapter {
    return this.chapterORMRepository.create(chapterPartial);
  }

  async save(chapter: Chapter): Promise<Chapter> {
    return this.chapterORMRepository.save(chapter);
  }

  async delete(chapterId: string): Promise<void> {
    await this.chapterORMRepository.delete(chapterId);
  }
}
