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
import { QueryRunner, DeleteResult, Repository } from 'typeorm';
import { RolesRepository } from '../roles/roles.repository';
import { User } from '../user/entities/user.entity';

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

      // Actualizar el rol del usuario a 'admin'
      await currentUserRepo.update(
        { auth0_id: userEntity.auth0_id },
        { role_id: adminRole.role_id },
      );
      // Opcional: Actualizar la entidad en memoria para reflejar el cambio si se necesita más adelante en este scope
      userEntity.role = adminRole;
      userEntity.role_id = adminRole.role_id;
      this.logger.log(
        `create(): Rol de usuario ${userEntity.email} actualizado a 'admin' mediante actualización directa.`,
      );

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
        // ************ CAMBIO CRÍTICO AQUÍ ************
        // Usar update directo para cambiar el rol del usuario, evita problemas con el primary key en save
        await userRepo.update(
          { auth0_id: admin.user.auth0_id }, // Condición WHERE
          { role_id: registradoRole.role_id }, // Valores a SET
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
      await queryRunner.release();
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
    const transactionalUserRepository = queryRunner.manager.getRepository(User);

    const userToResetRole = await transactionalUserRepository.findOne({
      where: { auth0_id: user_id },
      relations: ['role'],
    });

    const deleteResult = await transactionalAdminRepository.delete({
      user: { auth0_id: user_id },
    });

    if (deleteResult.affected && userToResetRole) {
      const registradoRole = await this.rolesRepository.findByName(
        'Registrado',
        queryRunner.manager,
      );
      if (registradoRole) {
        // ************ CAMBIO CRÍTICO AQUÍ ************
        // Usar update directo para cambiar el rol del usuario, evita problemas con el primary key en save
        await transactionalUserRepository.update(
          { auth0_id: userToResetRole.auth0_id }, // Condición WHERE
          { role_id: registradoRole.role_id }, // Valores a SET
        );
        this.logger.log(
          `removeAdminPermissionsByUserIdInternal(): Rol del usuario ${userToResetRole.email} reseteado a 'Registrado' mediante actualización directa.`,
        );
      } else {
        this.logger.warn(
          `removeAdminPermissionsByUserIdInternal(): Rol 'Registrado' no encontrado. No se pudo resetear el rol del usuario.`,
        );
      }
    }
    return deleteResult;
  }
}
