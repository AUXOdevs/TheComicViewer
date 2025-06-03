// src/user/entities/user.entity.ts
import { Role } from 'src/roles/entities/role.entity';
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'; // Importa JoinColumn

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'uuid', name: 'auth0_id' }) // <-- CAMBIO CLAVE AQUÍ
  auth0_id: string;

  // Si tenías un user_id que no era PK, lo dejarías como @Column
  // @Column({ type: 'uuid', name: 'user_id', unique: true, nullable: true })
  // user_id: string; // O elimínalo si no lo necesitas

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

  @Column({ type: 'uuid', nullable: true })
  role_id: string; // Esta propiedad representa directamente la columna role_id en tu tabla 'users'

  @ManyToOne(() => Role, (role) => role.users, {
    eager: true, // Si quieres que el rol se cargue automáticamente con el usuario
    onDelete: 'SET NULL', // Esto es bueno para la integridad referencial
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'role_id' }) // 'name' es la columna en la tabla 'users', 'referencedColumnName' es la PK en 'roles'
  role: Role;

  @Column({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
    default: null,
  })
  deleted_at: Date | null;
}
