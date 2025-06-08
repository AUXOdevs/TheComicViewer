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

@Entity('titles')
export class Title {
  @PrimaryGeneratedColumn('uuid', { name: 'title_id' })
  title_id: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  author: string | null;

  // 'genre' en tu SQL es un campo de texto, pero tienes una tabla 'genres' y 'title_genre'.
  // Asumo que este campo 'genre' en la tabla 'titles' se eliminará o se volverá obsoleto,
  // y la relación se manejará a través de 'title_genre'.
  // Por ahora, lo mantengo como texto nullable para coincidir con tu esquema actual.
  @Column({ type: 'text', nullable: true })
  genre: string | null;

  @Column({ type: 'text', enum: ['comic', 'manga'], nullable: false })
  type: 'comic' | 'manga';

  @Column({ type: 'text', nullable: true })
  status: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  publication_date: Date | null;

  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @Column({ type: 'text', nullable: true })
  category: string | null;

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
}
