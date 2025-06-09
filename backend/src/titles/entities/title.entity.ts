// src/titles/entities/title.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chapter } from '../../chapters/entities/chapter.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Rating } from '../../ratings/entities/rating.entity';
import { TitleGenre } from '../../title-genre/entities/title-genre.entity';
import { ReadingHistory } from '../../reading-history/entities/reading-history.entity';

@Entity('titles')
export class Title {
  @PrimaryGeneratedColumn('uuid', { name: 'title_id' })
  title_id: string;

  @Column({ name: 'title_name', unique: true, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  author: string;

  // La columna 'genre' se ELIMINA de la entidad porque se maneja con TitleGenre.
  // Si tu DB aún la tiene, la siguiente SQL la eliminará.

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ name: 'release_date', type: 'date', nullable: true }) // Mapea a 'release_date' en la DB
  publication_date: Date;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true }) // Mapea a 'cover_image_url' en la DB
  image_url: string;

  @Column({ type: 'text' })
  category: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relaciones
  @OneToMany(() => Chapter, (chapter) => chapter.title)
  chapters: Chapter[];

  @OneToMany(() => Favorite, (favorite) => favorite.title)
  favorites: Favorite[];

  @OneToMany(() => Comment, (comment) => comment.title)
  comments: Comment[];

  @OneToMany(() => Rating, (rating) => rating.title)
  ratings: Rating[];

  @OneToMany(() => TitleGenre, (titleGenre) => titleGenre.title)
  titleGenres: TitleGenre[];

  @OneToMany(() => ReadingHistory, (readingHistory) => readingHistory.title)
  readingHistory: ReadingHistory[];
}
