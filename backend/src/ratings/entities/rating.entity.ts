import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Title } from '../titles/title.entity';
import { Chapter } from '../chapters/chapter.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  rating_id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Title)
  title: Title;

  @ManyToOne(() => Chapter)
  chapter: Chapter;

  @Column()
  score: number;

  @Column({ type: 'timestamptz', nullable: true })
  rating_date: Date;
}
