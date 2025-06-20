import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Chapter } from './entities/chapter.entity';
import { InjectRepository } from '@nestjs/typeorm';

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
      .orderBy('chapter.chapter_number', 'ASC')
      .getMany();
  }

  // ************ CLAVE: Este método ya carga la relación con el título ************
  async findOneById(chapterId: string): Promise<Chapter | null> {
    return this.createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.title', 'title') // Importante: carga la relación 'title'
      .where('chapter.chapter_id = :chapterId', { chapterId })
      .getOne();
  }

  // El método findOneByIdWithTitle ya no es necesario ya que findOneById hace lo mismo

  async findByTitleIdAndChapterNumber(
    titleId: string,
    chapterNumber: number,
  ): Promise<Chapter | null> {
    return this.createQueryBuilder('chapter')
      .where('chapter.title_id = :titleId', { titleId })
      .andWhere('chapter.chapter_number = :chapterNumber', { chapterNumber })
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
