import { Injectable } from '@nestjs/common';
import { DataSource, Repository, DeleteResult } from 'typeorm'; // Importar DeleteResult
import { Admin } from './entities/admin.entity';
import { User } from '../user/entities/user.entity'; // Asegúrate de importar User para la relación

@Injectable()
export class AdminRepository extends Repository<Admin> {
  constructor(private dataSource: DataSource) {
    super(Admin, dataSource.createEntityManager());
  }

  // Encontrar un admin por su ID de administrador (PK de la tabla admins)
  async findOneByAdminId(admin_id: string): Promise<Admin | null> {
    return this.findOne({
      where: { admin_id },
      relations: ['user'], // Asegurarse de cargar la relación con el usuario
    });
  }

  // Encontrar un admin por el user_id (que es el auth0_id del User)
  async findByUserId(user_id: string): Promise<Admin | null> {
    return this.findOne({
      where: { user: { auth0_id: user_id } }, // Acceder a la propiedad auth0_id dentro de la relación user
      relations: ['user'],
    });
  }

  // Obtener todos los administradores
  async findAll(): Promise<Admin[]> {
    return this.find({ relations: ['user'] }); // Cargar la relación con el usuario
  }

  // Eliminar un admin por su ID de administrador (PK de la tabla admins)
  async removeByAdminId(admin_id: string): Promise<DeleteResult> {
    return this.delete({ admin_id });
  }

  // Nuevo método: Eliminar un admin por el ID del usuario asociado
  async removeByUserId(user_id: string): Promise<DeleteResult> {
    return this.delete({ user: { auth0_id: user_id } }); // Usar la relación para eliminar
  }
}
