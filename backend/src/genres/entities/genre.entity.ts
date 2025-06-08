import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TitleGenre } from '../../title-genre/entities/title-genre.entity';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid', { name: 'genre_id' })
  genre_id: string;

  @Column({ type: 'text', nullable: false, unique: true })
  name: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relación con la tabla de unión TitleGenre
  @OneToMany(() => TitleGenre, (titleGenre) => titleGenre.genre)
  titleGenres: TitleGenre[];
}
