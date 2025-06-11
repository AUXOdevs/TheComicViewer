import { Role } from 'src/roles/entities/role.entity';
import { Favorite } from '../../favorites/entities/favorite.entity'; // Importar
import { Comment } from '../../comments/entities/comment.entity'; // Importar
import { Rating } from '../../ratings/entities/rating.entity'; // Importar
import { ReadingHistory } from '../../reading-history/entities/reading-history.entity'; // Importar
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany, // Importar OneToMany
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'text', name: 'auth0_id' }) // <-- Asegúrate que sea TEXT en tu DB
  auth0_id: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  email_verified: boolean;

  @Column({ type: 'text', nullable: true })
  picture: string | null;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'last_login',
  })
  last_login: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @Column({ type: 'boolean', default: false, name: 'is_blocked' })
  is_blocked: boolean;

  @Column({ type: 'uuid', name: 'role_id', nullable: true })
  role_id: string | null;

  @ManyToOne(() => Role, (role) => role.users, {
    eager: false,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'role_id' })
  role: Role | null;

  @Column({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
    default: null,
  })
  deleted_at: Date | null;

  // --- Nuevas Relaciones ---
  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

  @OneToMany(() => ReadingHistory, (history) => history.user)
  readingHistories: ReadingHistory[];
}
