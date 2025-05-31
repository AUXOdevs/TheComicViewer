import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  admin_id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: true })
  content_permission: boolean;

  @Column({ default: true })
  user_permission: boolean;

  @Column({ default: true })
  moderation_permission: boolean;
}
