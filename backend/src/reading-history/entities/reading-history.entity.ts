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
import { User } from '../../user/entities/user.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';

@Entity('reading_history')
@Unique(['user_id', 'chapter_id']) // Ensures a user has only one history entry per chapter
export class ReadingHistory {
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  history_id: string;

  @Column({ type: 'text', name: 'user_id', nullable: false }) // user_id is text because auth0_id is text now
  user_id: string;

  @ManyToOne(() => User, (user) => user.readingHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  @Column({ type: 'uuid', name: 'chapter_id', nullable: false })
  chapter_id: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.readingHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id', referencedColumnName: 'chapter_id' })
  chapter: Chapter;

  @Column({ type: 'int', nullable: true })
  last_page: number | null; // Nullable if history starts with page 0 or a completed chapter

  @CreateDateColumn({ type: 'timestamptz', name: 'access_date' }) // Use access_date for initial entry
  access_date: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) // Add updated_at to track last progress
  updated_at: Date;

  @Column({ type: 'boolean', default: false, nullable: false })
  completed: boolean;
}
