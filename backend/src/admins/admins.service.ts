// src/admins/admins.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UserService } from '../user/user.service';
import { AdminRepository } from './admins.repository';
import { QueryRunner, DeleteResult, Repository, Not } from 'typeorm'; // Importar Not
import { RolesRepository } from '../roles/roles.repository';
import { User } from '../user/entities/user.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly adminRepository: AdminRepository,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly rolesRepository: RolesRepository,
  ) {}

  async create(
    createAdminDto: CreateAdminDto,
    existingQueryRunner?: QueryRunner,
  ): Promise<Admin> {
    this.logger.debug(
      `create(): Intentando crear admin para user_id: ${createAdminDto.user_id}`,
    );

    const manager = existingQueryRunner
      ? existingQueryRunner.manager
      : this.adminRepository.manager;
    const adminRepo = manager.getRepository(Admin);
    const userRepo = manager.getRepository(User);

    const userEntity = await userRepo.findOne({
      where: { auth0_id: createAdminDto.user_id },
      relations: ['role'],
      withDeleted: false,
    });

    if (!userEntity) {
      this.logger.warn(
        `create(): Usuario con Auth0 ID "${createAdminDto.user_id}" no encontrado, inactivo o bloqueado. No se puede hacer admin.`,
      );
      throw new BadRequestException(
        `Active user with Auth0 ID "${createAdminDto.user_id}" not found or is not active. Cannot make admin.`,
      );
    }

    const existingAdmin = await adminRepo.findOne({
      where: { user: { auth0_id: createAdminDto.user_id } },
      relations: ['user'],
    });

    if (existingAdmin) {
      this.logger.warn(
        `create(): Usuario con Auth0 ID "${createAdminDto.user_id}" ya es un admin.`,
      );
      throw new ConflictException(
        `User with Auth0 ID "${createAdminDto.user_id}" is already an admin.`,
      );
    }

    const adminRole = await this.rolesRepository.findByName('admin', manager);
    if (!adminRole) {
      this.logger.error(
        `create(): Rol 'admin' no encontrado en la base de datos.`,
      );
      throw new InternalServerErrorException(
        'Admin role not found in the database. Please ensure it exists and has a UUID.',
      );
    }

    let ownQueryRunner: QueryRunner | undefined;
    if (!existingQueryRunner) {
      ownQueryRunner =
        this.adminRepository.manager.connection.createQueryRunner();
      await ownQueryRunner.connect();
      await ownQueryRunner.startTransaction();
    }
    const currentManager = ownQueryRunner ? ownQueryRunner.manager : manager;
    const currentAdminRepo = currentManager.getRepository(Admin);
    const currentUserRepo = currentManager.getRepository(User);

    try {
      const adminEntity = currentAdminRepo.create({
        user: userEntity,
        content_permission: createAdminDto.content_permission,
        user_permission: createAdminDto.user_permission,
        moderation_permission: createAdminDto.moderation_permission,
      });

      const savedAdmin = await currentAdminRepo.save(adminEntity);
      this.logger.log(
        `create(): Entrada de admin creada para user_id: ${createAdminDto.user_id}`,
      );

      // La lógica de actualización de rol se deja en UserService.update
      // Este bloque solo se ejecuta si `create` es llamado directamente (no desde UserService.update)
      if (!existingQueryRunner) {
        await currentUserRepo.update(
          { auth0_id: userEntity.auth0_id },
          { role_id: adminRole.role_id },
        );
        userEntity.role = adminRole;
        userEntity.role_id = adminRole.role_id;
        this.logger.log(
          `create(): Rol de usuario ${userEntity.email} actualizado a 'admin' mediante actualización directa (desde AdminService.create).`,
        );
      } else {
        this.logger.debug(
          `create(): Rol del usuario ${userEntity.email} no actualizado por AdminService.create, asumido por UserService.update.`,
        );
      }

      const finalAdmin = await currentManager.getRepository(Admin).findOne({
        where: { admin_id: savedAdmin.admin_id },
        relations: ['user'],
      });

      if (!finalAdmin) {
        throw new InternalServerErrorException(
          'Failed to retrieve created admin after save.',
        );
      }

      if (ownQueryRunner) {
        await ownQueryRunner.commitTransaction();
        this.logger.log(
          `create(): Transacción completada exitosamente para user_id: ${createAdminDto.user_id}`,
        );
      }

      return finalAdmin;
    } catch (error) {
      if (ownQueryRunner) {
        await ownQueryRunner.rollbackTransaction();
      }
      this.logger.error(
        `create(): Error durante la transacción de creación de admin para user_id ${createAdminDto.user_id}:`,
        error,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create admin due to an internal error.',
      );
    } finally {
      if (ownQueryRunner) {
        await ownQueryRunner.release();
      }
    }
  }

  async createOrUpdateAdminEntry(
    userId: string,
    permissions: Partial<Admin>,
    existingQueryRunner?: QueryRunner, // Aceptar QueryRunner para transacciones externas
  ): Promise<Admin> {
    this.logger.debug(
      `createOrUpdateAdminEntry(): Procesando entrada de admin para user_id: ${userId}`,
    );

    const manager = existingQueryRunner
      ? existingQueryRunner.manager
      : this.adminRepository.manager;
    const adminRepo = manager.getRepository(Admin);
    const userRepo = manager.getRepository(User); // Necesario para buscar el User

    // Cargar el userEntity para vincularlo al admin
    const userEntity = await userRepo.findOne({
      where: { auth0_id: userId },
      withDeleted: true, // Permitir encontrar usuarios soft-deleted si es necesario
    });
    if (!userEntity) {
      this.logger.warn(
        `createOrUpdateAdminEntry(): Usuario con Auth0 ID "${userId}" no encontrado para operación de admin.`,
      );
      throw new NotFoundException(
        `User with Auth0 ID "${userId}" not found for admin operation.`,
      );
    }

    let adminEntry = await adminRepo.findOne({
      where: { user: { auth0_id: userId } },
      relations: ['user'],
    });

    if (adminEntry) {
      this.logger.log(
        `createOrUpdateAdminEntry(): Actualizando permisos para admin existente con user_id: ${userId}`,
      );
      Object.assign(adminEntry, permissions);
      return adminRepo.save(adminEntry); // Usar el repositorio transaccional
    } else {
      this.logger.log(
        `createOrUpdateAdminEntry(): Creando nueva entrada de admin para user_id: ${userId}`,
      );
      const adminEntity = adminRepo.create({
        user: userEntity, // Vincular a la entidad de usuario
        content_permission: permissions.content_permission,
        user_permission: permissions.user_permission,
        moderation_permission: permissions.moderation_permission,
      });
      return adminRepo.save(adminEntity); // Usar el repositorio transaccional
    }
  }

  async deleteAdminEntry(
    userId: string,
    existingQueryRunner?: QueryRunner,
  ): Promise<void> {
    this.logger.debug(
      `deleteAdminEntry(): Eliminando entrada de admin para user_id: ${userId}`,
    );

    const manager = existingQueryRunner
      ? existingQueryRunner.manager
      : this.adminRepository.manager;
    const adminRepo = manager.getRepository(Admin);

    const adminEntry = await adminRepo.findOne({
      where: { user: { auth0_id: userId } },
    });
    if (!adminEntry) {
      this.logger.warn(
        `deleteAdminEntry(): No se encontró entrada de admin para user_id: ${userId}. No se eliminó nada.`,
      );
      return;
    }

    // Si no se proporciona un queryRunner externo, iniciar una transacción propia
    let ownQueryRunner: QueryRunner | undefined;
    if (!existingQueryRunner) {
      ownQueryRunner =
        this.adminRepository.manager.connection.createQueryRunner();
      await ownQueryRunner.connect();
      await ownQueryRunner.startTransaction();
    }
    const currentAdminRepo = ownQueryRunner
      ? ownQueryRunner.manager.getRepository(Admin)
      : adminRepo;

    try {
      await currentAdminRepo.delete({ user: { auth0_id: userId } });
      this.logger.log(
        `deleteAdminEntry(): Entrada de admin eliminada para user_id: ${userId}.`,
      );

      if (ownQueryRunner) {
        await ownQueryRunner.commitTransaction();
        this.logger.log(
          `deleteAdminEntry(): Transacción de eliminación de admin completada para user_id: ${userId}.`,
        );
      }
    } catch (error) {
      if (ownQueryRunner) {
        await ownQueryRunner.rollbackTransaction();
      }
      this.logger.error(
        `deleteAdminEntry(): Error durante la transacción de eliminación de admin para user_id ${userId}:`,
        error.message,
      );
      throw new InternalServerErrorException('Failed to remove admin entry.');
    } finally {
      if (ownQueryRunner) {
        await ownQueryRunner.release();
      }
    }
  }

  async findAll(): Promise<Admin[]> {
    this.logger.debug('findAll(): Buscando todos los administradores.');
    return this.adminRepository.findAll();
  }

  async findOne(admin_id: string): Promise<Admin> {
    this.logger.debug(`findOne(): Buscando administrador con ID: ${admin_id}`);
    const admin = await this.adminRepository.findOneByAdminId(admin_id);
    if (!admin) {
      this.logger.warn(
        `findOne(): Administrador con ID "${admin_id}" no encontrado.`,
      );
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }
    return admin;
  }

  async findByUserIdInternal(user_id: string): Promise<Admin | null> {
    this.logger.debug(
      `findByUserIdInternal(): Buscando administrador por user_id: ${user_id}`,
    );
    return this.adminRepository.findByUserId(user_id);
  }

  async update(
    admin_id: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    this.logger.debug(
      `update(): Actualizando administrador con ID: ${admin_id}`,
    );
    const admin = await this.adminRepository.findOneByAdminId(admin_id);
    if (!admin) {
      this.logger.warn(
        `update(): Administrador con ID "${admin_id}" no encontrado.`,
      );
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }

    if (
      updateAdminDto.user_id &&
      updateAdminDto.user_id !== admin.user?.auth0_id
    ) {
      this.logger.warn(
        `update(): Intentando cambiar user_id de admin ${admin_id}. Operación no permitida.`,
      );
      throw new BadRequestException(
        'Cannot change the user of an existing admin record. Please delete and create a new one.',
      );
    }

    const { user_id, ...permissionsToUpdate } = updateAdminDto;
    Object.assign(admin, permissionsToUpdate);

    const updatedAdmin = await this.adminRepository.save(admin);
    this.logger.log(
      `update(): Administrador ${admin_id} actualizado exitosamente.`,
    );
    return this.adminRepository.findOneByAdminId(
      updatedAdmin.admin_id,
    ) as Promise<Admin>;
  }

  async remove(admin_id: string): Promise<void> {
    this.logger.debug(
      `remove(): Intentando eliminar administrador con ID: ${admin_id}`,
    );

    const admin = await this.adminRepository.findOneByAdminId(admin_id);
    if (!admin) {
      this.logger.warn(
        `remove(): Administrador con ID "${admin_id}" no encontrado.`,
      );
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }

    const registradoRole = await this.rolesRepository.findByName('Registrado');
    if (!registradoRole) {
      this.logger.error(
        `remove(): Rol 'Registrado' no encontrado en la base de datos.`,
      );
      throw new InternalServerErrorException(
        'Default role "Registrado" not found in the database. Cannot reset user role.',
      );
    }

    const queryRunner =
      this.adminRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adminRepo = queryRunner.manager.getRepository(Admin);
      const userRepo = queryRunner.manager.getRepository(User);

      const deleteResult = await adminRepo.delete({ admin_id });
      if (deleteResult.affected === 0) {
        this.logger.warn(
          `remove(): No se pudo eliminar la entrada de admin con ID "${admin_id}".`,
        );
        throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
      }
      this.logger.log(`remove(): Entrada de admin ${admin_id} eliminada.`);

      if (admin.user) {
        await userRepo.update(
          { auth0_id: admin.user.auth0_id },
          { role_id: registradoRole.role_id },
        );
        this.logger.log(
          `remove(): Rol del usuario ${admin.user.email} reseteado a 'Registrado' mediante actualización directa.`,
        );
      } else {
        this.logger.warn(
          `remove(): Usuario asociado al admin ${admin_id} no cargado. No se pudo resetear el rol.`,
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `remove(): Transacción de eliminación de admin completada exitosamente para ID: ${admin_id}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `remove(): Error durante la transacción de eliminación de admin para ID ${admin_id}:`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove admin due to an internal error.',
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async removeAdminPermissionsByUserIdInternal(
    user_id: string,
    queryRunner: QueryRunner,
  ): Promise<DeleteResult> {
    this.logger.debug(
      `removeAdminPermissionsByUserIdInternal(): Eliminando permisos de admin para user_id: ${user_id}`,
    );
    const transactionalAdminRepository =
      queryRunner.manager.getRepository(Admin);

    const deleteResult = await transactionalAdminRepository.delete({
      user: { auth0_id: user_id },
    });

    return deleteResult;
  }
}
