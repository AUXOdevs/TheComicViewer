// src/genres/entities/genre.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TitleGenre } from '../../title-genre/entities/title-genre.entity'; // Asegúrate de la ruta

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid', { name: 'genre_id' })
  genre_id: string;

  @Column({ type: 'text', unique: true, nullable: false })
  name: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relaciones
  @OneToMany(() => TitleGenre, (titleGenre) => titleGenre.genre)
  titleGenres: TitleGenre[];
}
