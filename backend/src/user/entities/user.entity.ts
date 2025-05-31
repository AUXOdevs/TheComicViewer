import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from '../roles/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  auth0_id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  last_login: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ default: false })
  is_blocked: boolean;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;
}
