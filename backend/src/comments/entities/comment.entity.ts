// src/comments/entities/comment.entity.ts

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
import { Title } from '../../titles/entities/title.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid', { name: 'comment_id' })
  comment_id: string;

  @Column({ type: 'text', name: 'user_id', nullable: false })
  user_id: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @ManyToOne(() => Title, (title) => title.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @Column({ type: 'uuid', name: 'chapter_id', nullable: true })
  chapter_id: string | null;

  @ManyToOne(() => Chapter, (chapter) => chapter.comments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id', referencedColumnName: 'chapter_id' })
  chapter: Chapter | null;

  @Column({ type: 'text', nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'comment_date' })
  comment_date: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
