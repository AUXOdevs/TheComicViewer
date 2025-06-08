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

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn('uuid', { name: 'favorite_id' })
  favorite_id: string;

  @Column({ type: 'text', name: 'user_id', nullable: false }) // user_id is text because auth0_id is text now
  user_id: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  @Column({ type: 'uuid', name: 'title_id', nullable: false })
  title_id: string;

  @ManyToOne(() => Title, (title) => title.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'title_id', referencedColumnName: 'title_id' })
  title: Title;

  @Column({ type: 'uuid', name: 'chapter_id', nullable: true }) // Can favorite a title OR a specific chapter
  chapter_id: string | null;

  @ManyToOne(() => Chapter, (chapter) => chapter.favorites, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id', referencedColumnName: 'chapter_id' })
  chapter: Chapter | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'date_added' })
  date_added: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date; // Añadido para seguir consistencia
}
