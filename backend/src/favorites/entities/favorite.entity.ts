// src/favorites/entities/favorite.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Title } from '../../titles/entities/title.entity';
import { Chapter } from '../../chapters/entities/chapter.entity'; // Importar la entidad Chapter

@Entity('favorites')
@Unique(['user_id', 'title_id', 'chapter_id']) // Un favorito es único por usuario, título y capítulo
export class Favorite {
  @PrimaryGeneratedColumn('uuid', { name: 'favorite_id' })
  favorite_id: string;

  @Column({ type: 'text', name: 'user_id', nullable: false }) // user_id es el auth0_id del usuario
  user_id: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @ManyToOne(() => Title, (title) => title.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @Column({ type: 'uuid', name: 'chapter_id', nullable: true }) // <-- Esta es la columna que falta
  chapter_id: string | null;

  @ManyToOne(() => Chapter, (chapter) => chapter.favorites, {
    nullable: true, // Puede ser nulo si el favorito es solo para el título
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id', referencedColumnName: 'chapter_id' })
  chapter: Chapter | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'date_added' }) // Fecha en que se añadió a favoritos
  date_added: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) // Fecha de última actualización
  updated_at: Date;
}
