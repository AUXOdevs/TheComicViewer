import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Chapter } from '../chapters/chapter.entity';

@Entity('reading_history')
export class ReadingHistory {
  @PrimaryGeneratedColumn('uuid')
  history_id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Chapter)
  chapter: Chapter;

  @Column()
  last_page: number;

  @Column({ type: 'timestamptz', nullable: true })
  access_date: Date;

  @Column({ default: false })
  completed: boolean;
}
