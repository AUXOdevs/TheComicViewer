import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check, // Importa Check decorator
  Unique, // Importa Unique decorator
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Title } from '../../titles/entities/title.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';

@Entity('ratings')
// La combinación de user_id, title_id y chapter_id debe ser única para evitar múltiples calificaciones por el mismo usuario
@Unique(['user_id', 'title_id', 'chapter_id'])
@Check(`score >= 1 AND score <= 5`)
export class Rating {
  @PrimaryGeneratedColumn('uuid', { name: 'rating_id' })
  rating_id: string;

  @Column({ type: 'text', name: 'user_id', nullable: false })
  user_id: string;

  @ManyToOne(() => User, (user) => user.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @ManyToOne(() => Title, (title) => title.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @Column({ type: 'uuid', name: 'chapter_id', nullable: true })
  chapter_id: string | null;

  @ManyToOne(() => Chapter, (chapter) => chapter.ratings, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id', referencedColumnName: 'chapter_id' })
  chapter: Chapter | null;

  @Column({ type: 'int', nullable: false })
  score: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'rating_date' })
  rating_date: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
