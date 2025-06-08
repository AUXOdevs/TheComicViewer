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

  @ManyToOne(() => Title, (title) => title.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'timestamptz', nullable: true })
  release_date: Date | null;

  @Column({ type: 'jsonb', nullable: false }) // Assuming 'pages' is an array of URLs stored as JSONB
  pages: string[]; // Store as JSON string in DB, handle as string[] in app

  @Column({ type: 'int', nullable: false, name: 'chapter_number' })
  chapter_number: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relaciones
  @OneToMany(() => Favorite, (favorite) => favorite.chapter)
  favorites: Favorite[];

  @OneToMany(() => Comment, (comment) => comment.chapter)
  comments: Comment[];

  @OneToMany(() => Rating, (rating) => rating.chapter)
  ratings: Rating[];

  @OneToMany(() => ReadingHistory, (history) => history.chapter)
  readingHistories: ReadingHistory[];
}
