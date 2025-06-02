import { Chapter } from 'src/chapters/entities/chapter.entity';
import { Title } from 'src/titles/entities/title.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

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
