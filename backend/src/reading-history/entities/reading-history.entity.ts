import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique, // Importar Unique
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';
import { Title } from '../../titles/entities/title.entity';

@Entity('reading_history')
@Unique(['user_id', 'chapter_id']) // Asegura que solo haya un registro de historial por usuario y capítulo
export class ReadingHistory {
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  history_id: string;

  @Column({ type: 'text', name: 'user_id', nullable: false })
  user_id: string;

  @Column({ type: 'uuid', name: 'title_id', nullable: false }) // El ID del título al que pertenece el capítulo
  title_id: string;

  @Column({ type: 'uuid', name: 'chapter_id', nullable: false })
  chapter_id: string;

  @Column({ type: 'int', name: 'last_page', nullable: true })
  last_page: number | null;

  @Column({ type: 'boolean', name: 'completed', default: false })
  completed: boolean;

  @CreateDateColumn({
    // Fecha del primer acceso o registro del historial
    type: 'timestamptz',
    name: 'access_date',
  })
  access_date: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // Relaciones ManyToOne
  @ManyToOne(() => User, (user) => user.readingHistories, {
    onDelete: 'CASCADE', // Si el usuario es eliminado, también su historial
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  @ManyToOne(() => Title, (title) => title.readingHistory, {
    onDelete: 'CASCADE', // Si el título es eliminado, también su historial
  })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @ManyToOne(() => Chapter, (chapter) => chapter.readingHistory, {
    onDelete: 'CASCADE', // Si el capítulo es eliminado, también su historial
  })
  @JoinColumn({ name: 'chapter_id', referencedColumnName: 'chapter_id' })
  chapter: Chapter;
}
