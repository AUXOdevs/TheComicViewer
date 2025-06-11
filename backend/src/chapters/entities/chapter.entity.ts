// src/chapters/entities/chapter.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Title } from '../../titles/entities/title.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Rating } from '../../ratings/entities/rating.entity';
import { ReadingHistory } from '../../reading-history/entities/reading-history.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid', { name: 'chapter_id' })
  chapter_id: string;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @Column({ name: 'chapter_name', type: 'text', nullable: true }) // Mapea a 'chapter_name' en DB, y es nullable: true
  name: string; // La propiedad en la entidad se llama 'name'

  @Column({ type: 'date', name: 'release_date', nullable: true })
  release_date: Date | null;

  @Column({ name: 'content_url', type: 'jsonb', nullable: true }) // Mapea a 'content_url' en DB, tipo JSONB
  pages: string; // La propiedad en la entidad se llama 'pages', almacena JSON string

  @Column({ type: 'int', name: 'chapter_number', nullable: false })
  chapter_number: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relaciones ManyToOne
  @ManyToOne(() => Title, (title) => title.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  // Relaciones OneToMany
  @OneToMany(() => Favorite, (favorite) => favorite.chapter)
  favorites: Favorite[];

  @OneToMany(() => Comment, (comment) => comment.chapter)
  comments: Comment[];

  @OneToMany(() => Rating, (rating) => rating.chapter)
  ratings: Rating[];

  // Asegúrate de que esta propiedad exista en ReadingHistory y que la relación sea correcta.
  // El nombre de la propiedad en Chapter es 'readingHistory' (singular)
  @OneToMany(() => ReadingHistory, (readingHistory) => readingHistory.chapter)
  readingHistory: ReadingHistory[];
}
