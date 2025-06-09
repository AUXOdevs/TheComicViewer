// src/title-genre/entities/title-genre.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Title } from '../../titles/entities/title.entity';
import { Genre } from '../../genres/entities/genre.entity';

@Entity('title_genre')
@Unique(['title_id', 'genre_id']) // Asegura que una combinación título-género sea única
export class TitleGenre {
  @PrimaryGeneratedColumn('uuid', { name: 'title_genre_id' }) // <-- Esta es la columna que busca
  title_genre_id: string;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @Column({ type: 'uuid', name: 'genre_id', nullable: false })
  genre_id: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relaciones ManyToOne
  @ManyToOne(() => Title, (title) => title.titleGenres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @ManyToOne(() => Genre, (genre) => genre.titleGenres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id', referencedColumnName: 'genre_id' })
  genre: Genre;
}
