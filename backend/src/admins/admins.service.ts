import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UserService } from '../user/user.service';
import { AdminRepository } from './admins.repository';
import { QueryRunner, DeleteResult } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    // 1. Verificar que el usuario exista y ESTÉ ACTIVO
    const user = await this.userService.findOne(createAdminDto.user_id, false);
    if (!user) {
      throw new BadRequestException(
        `Active user with Auth0 ID "${createAdminDto.user_id}" not found or is not active. Cannot make admin.`,
      );
    }

    // 2. Verificar que el usuario no sea ya admin
    const existingAdmin = await this.adminRepository.findByUserId(
      createAdminDto.user_id,
    );
    if (existingAdmin) {
      throw new ConflictException(
        `User with Auth0 ID "${createAdminDto.user_id}" is already an admin.`,
      );
    }

    // Al crear, asignamos la entidad User completa a la relación 'user'
    // El repositorio se encargará de guardar el 'user_id' correcto basado en la relación.
    const adminEntity = this.adminRepository.create({
      user: user, // <--- CAMBIO CLAVE: Asignar la entidad User completa
      content_permission: createAdminDto.content_permission,
      user_permission: createAdminDto.user_permission,
      moderation_permission: createAdminDto.moderation_permission,
    });

    const savedAdmin = await this.adminRepository.save(adminEntity);
    // Recargar para asegurar que la relación 'user' esté cargada si es necesario en la respuesta
    return this.adminRepository.findOneByAdminId(
      savedAdmin.admin_id,
    ) as Promise<Admin>;
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.findAll();
  }

  async findOne(admin_id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOneByAdminId(admin_id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }
    return admin;
  }

  async findByUserIdInternal(user_id: string): Promise<Admin | null> {
    return this.adminRepository.findByUserId(user_id);
  }

  async update(
    admin_id: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    const admin = await this.adminRepository.findOneByAdminId(admin_id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }

    // No se debería cambiar el user_id de un registro de admin existente.
    if (
      updateAdminDto.user_id &&
      updateAdminDto.user_id !== admin.user?.auth0_id
    ) {
      // Usar admin.user?.auth0_id
      throw new BadRequestException(
        'Cannot change the user of an existing admin record. Please delete and create a new one.',
      );
    }

    const { user_id, ...permissionsToUpdate } = updateAdminDto;
    Object.assign(admin, permissionsToUpdate);

    const updatedAdmin = await this.adminRepository.save(admin);
    return this.adminRepository.findOneByAdminId(
      updatedAdmin.admin_id,
    ) as Promise<Admin>;
  }

  async remove(admin_id: string): Promise<void> {
    const deleteResult = await this.adminRepository.removeByAdminId(admin_id);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }
  }

  async removeAdminPermissionsByUserIdInternal(
    user_id: string,
    queryRunner: QueryRunner,
  ): Promise<DeleteResult> {
    const transactionalAdminRepository =
      queryRunner.manager.getRepository(Admin);
    return transactionalAdminRepository.delete({ user: { auth0_id: user_id } }); // <--- CAMBIO CLAVE: Eliminar por la relación
  }
}
