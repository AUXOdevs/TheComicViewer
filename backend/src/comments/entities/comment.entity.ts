import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Title } from '../titles/title.entity';
import { Chapter } from '../chapters/chapter.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  comment_id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Title)
  title: Title;

  @ManyToOne(() => Chapter)
  chapter: Chapter;

  @Column()
  content: string;

  @Column({ type: 'timestamptz', nullable: true })
  comment_date: Date;
}
