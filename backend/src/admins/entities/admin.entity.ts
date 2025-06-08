import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid', { name: 'admin_id' })
  admin_id: string;

  @Column({ type: 'text', name: 'user_id', unique: true, nullable: false }) // <-- Cambio clave: de uuid a text
  user_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' }) // <-- referencedColumnName debe ser auth0_id
  user: User;

  @Column({ type: 'boolean', default: true, name: 'content_permission' })
  content_permission: boolean;

  @Column({ type: 'boolean', default: true, name: 'user_permission' })
  user_permission: boolean;

  @Column({ type: 'boolean', default: true, name: 'moderation_permission' })
  moderation_permission: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
