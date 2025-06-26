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

  // ************ ¡CORRECCIÓN AQUÍ! ELIMINAMOS 'name' ************
  // La columna en la DB es 'last_page' y la propiedad de la entidad es 'last_page'.
  // Por lo tanto, no necesitamos el atributo 'name'.
  @Column({ type: 'int', nullable: true })
  last_page: number | null;
  // ************ FIN CORRECCIÓN ************

  @Column({ type: 'boolean', name: 'completed', default: false })
  completed: boolean;

  // ************ ¡CORRECCIÓN AQUÍ! ELIMINAMOS 'name' ************
  // La columna en la DB es 'access_date' y la propiedad de la entidad es 'access_date'.
  // Por lo tanto, no necesitamos el atributo 'name'.
  @CreateDateColumn({
    // Fecha del primer acceso o registro del historial
    type: 'timestamptz',
  })
  access_date: Date;
  // ************ FIN CORRECCIÓN ************

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
