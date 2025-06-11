// src/reading-history/entities/reading-history.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';
import { Title } from '../../titles/entities/title.entity';

@Entity('reading_history')
export class ReadingHistory {
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  history_id: string;

  @Column({ type: 'text', name: 'user_id', nullable: false })
  user_id: string;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @Column({ type: 'uuid', name: 'chapter_id', nullable: false })
  chapter_id: string;

  @Column({ type: 'int', name: 'last_page', nullable: true })
  last_page: number | null;

  @Column({ type: 'boolean', name: 'completed', default: false })
  completed: boolean;

  @Column({
    type: 'timestamptz',
    name: 'access_date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  access_date: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relaciones ManyToOne
  @ManyToOne(() => User, (user) => user.readingHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  @ManyToOne(() => Title, (title) => title.readingHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @ManyToOne(() => Chapter, (chapter) => chapter.readingHistory, {
    // <-- Corregido aquí
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id', referencedColumnName: 'chapter_id' })
  chapter: Chapter;
}
