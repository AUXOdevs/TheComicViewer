// src/roles/roles.repository.ts
import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Role } from './entities/role.entity'; // Importa la entidad Role
import { User } from '../user/entities/user.entity'; // Importa la entidad User para consultas relacionadas
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class RolesRepository extends Repository<Role> {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super(Role, dataSource.createEntityManager());
  }

  /**
   * Busca un rol por su nombre.
   * @param name El nombre del rol a buscar.
   * @returns El rol encontrado o undefined si no existe.
   */
  async findByName(name: string): Promise<Role | undefined> {
    return this.findOne({ where: { name } });
  }

  /**
   * Busca todos los usuarios asociados a un rol específico por su ID.
   * Este método se coloca aquí para centralizar las operaciones de DB relacionadas con roles,
   * aunque técnicamente consulta la tabla de usuarios.
   * @param roleId El ID del rol.
   * @returns Un array de entidades User.
   */
  async findUsersByRoleId(roleId: string): Promise<User[]> {
    // Obtiene el repositorio de User a través del DataSource
    return this.dataSource.getRepository(User).find({
      where: { role: { role_id: roleId } }, // Filtra por el ID del rol en la relación
      relations: ['role'], // Carga la relación 'role' si necesitas los datos del rol en los objetos User
    });
  }
}
