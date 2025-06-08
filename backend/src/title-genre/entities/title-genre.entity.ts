import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique, // Import Unique decorator
} from 'typeorm';
import { Title } from '../../titles/entities/title.entity';
import { Genre } from '../../genres/entities/genre.entity';

@Entity('title_genre')
@Unique(['title_id', 'genre_id']) // Ensures a title can only have a specific genre once
export class TitleGenre {
  @PrimaryGeneratedColumn('uuid', { name: 'title_genre_id' })
  title_genre_id: string;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @ManyToOne(() => Title, (title) => title.titleGenres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @Column({ type: 'uuid', name: 'genre_id', nullable: false })
  genre_id: string;

  @ManyToOne(() => Genre, (genre) => genre.titleGenres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id', referencedColumnName: 'genre_id' })
  genre: Genre;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
