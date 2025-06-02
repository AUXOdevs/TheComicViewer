import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  admin_id: string;

  // Si la clave foránea está en la tabla 'admins' y se llama 'user_id'
  // y se refiere a la PK 'auth0_id' de la tabla 'users'.
  @OneToOne(() => User) // No necesitamos 'eager: true' aquí, lo controlaremos en el servicio si es necesario
  @JoinColumn({ name: 'user_id', referencedColumnName: 'auth0_id' }) // <-- ¡Esta es la clave!
  user: User;

  // Además, aunque la relación @OneToOne gestiona la columna user_id,
  // si también la definiste como @Column en tu entidad (como tenías antes):
  // @Column({ type: 'uuid' }) // Podrías mantenerla explícitamente si quieres, pero es redundante con @JoinColumn
  // user_id: string; // Si la tienes, quítala. @JoinColumn ya lo gestiona.

  @Column({ default: true })
  content_permission: boolean;

  @Column({ default: true })
  user_permission: boolean;

  @Column({ default: true })
  moderation_permission: boolean;
}
