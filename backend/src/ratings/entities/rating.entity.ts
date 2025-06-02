import { Chapter } from 'src/chapters/entities/chapter.entity';
import { Title } from 'src/titles/entities/title.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';


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
