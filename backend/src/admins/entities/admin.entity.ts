// src/admins/entities/admin.entity.ts
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  admin_id: string;

  @Column({ type: 'text', unique: true, name: 'user_id' })
  user_id: string;

  @OneToOne(() => User, (user) => user.admin)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' })
  user: User;

  // Columna 'assigned_at' de la base de datos
  @Column({
    type: 'timestamptz',
    name: 'assigned_at',
    nullable: true,
    default: () => 'NOW()',
  })
  assigned_at: Date;

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
