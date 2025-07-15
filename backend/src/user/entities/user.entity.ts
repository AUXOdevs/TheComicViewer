import { Role } from 'src/roles/entities/role.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Rating } from '../../ratings/entities/rating.entity';
import { ReadingHistory } from '../../reading-history/entities/reading-history.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Admin } from 'src/admins/entities/admin.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'text', name: 'auth0_id' })
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
  @Exclude({ toPlainOnly: true })
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

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

  @OneToMany(() => ReadingHistory, (history) => history.user)
  readingHistories: ReadingHistory[];

  // Modificación CRÍTICA para cargar los permisos del Admin directamente con el usuario
  @OneToOne(() => Admin, (admin) => admin.user, {
    eager: true, // ¡IMPORTANTE! Carga la relación 'admin' automáticamente
    nullable: true, // Un usuario puede no ser admin
  })
  @JoinColumn({ name: 'auth0_id', referencedColumnName: 'user_id' }) // Asegúrate que el JoinColumn esté en User
  admin: Admin | null; // El usuario puede no tener una entrada de admin
}
