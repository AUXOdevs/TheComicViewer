// src/user/user.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  forwardRef,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { RolesRepository } from '../roles/roles.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AdminService } from 'src/admins/admins.service';
import { Role } from '../roles/entities/role.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderDto } from 'src/common/dto/order.dto';
import { Admin } from 'src/admins/entities/admin.entity';
import { UserDto } from './dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { DataSource, Not } from 'typeorm'; // <-- Importar DataSource y Not

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly rolesRepository: RolesRepository,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,
    private readonly dataSource: DataSource,
  ) {}

  async createInitialUser(
    auth0Id: string,
    email: string,
    name: string | null,
    emailVerified: boolean = false,
    picture: string | null = null,
  ): Promise<User> {
    this.logger.debug(
      `createInitialUser(): Procesando usuario inicial para Auth0 ID: ${auth0Id}.`,
    );

    let user = await this.userRepository.findOneByAuth0Id(auth0Id, true);

    if (user) {
      if (user.deleted_at !== null) {
        this.logger.log(
          `createInitialUser(): Reactivando usuario existente "${email}" (Auth0 ID: ${auth0Id}).`,
        );
        await this.userRepository.reactivate(auth0Id);
        user = await this.userRepository.findOneByAuth0Id(auth0Id, false);
      }
      this.logger.log(
        `createInitialUser(): Usuario "${email}" (ID: ${auth0Id}) ya existe y está activo. Retornando usuario existente.`,
      );
      return user;
    }

    const existingByEmail = await this.userRepository.findByEmailSimple(email);
    if (existingByEmail) {
      this.logger.warn(
        `createInitialUser(): Conflicto: Email "${email}" ya en uso por otro Auth0 ID.`,
      );
      throw new ConflictException(`Ya existe un usuario con email "${email}".`);
    }

    let defaultRole: Role | null =
      await this.rolesRepository.findByName('Registrado');
    if (!defaultRole) {
      this.logger.error(
        'El rol "Registrado" no fue encontrado. Asegúrate de que los roles por defecto estén en la DB.',
      );
      throw new BadRequestException('Role "Registrado" not found in database.');
    }

    const newUser = this.userRepository.create({
      auth0_id: auth0Id,
      email,
      name,
      email_verified: emailVerified,
      picture,
      last_login: new Date(),
      role_id: defaultRole.role_id,
      role: defaultRole,
    });
    const savedUser = await this.userRepository.save(newUser);

    this.logger.log(
      `createInitialUser(): Nuevo usuario "${email}" (ID: ${auth0Id}) creado exitosamente.`,
    );
    return savedUser;
  }

  async findMe(auth0Id: string): Promise<User> {
    this.logger.debug(`findMe(): Buscando perfil para el usuario ${auth0Id}.`);
    const user = await this.userRepository.findOneByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException(
        `Perfil de usuario con ID "${auth0Id}" no encontrado.`,
      );
    }
    return user;
  }

  async updateMe(auth0Id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.debug(
      `updateMe(): Actualizando perfil del usuario ${auth0Id}.`,
    );

    const existingUser = await this.userRepository.findOneByAuth0Id(auth0Id);
    if (!existingUser) {
      throw new NotFoundException(
        `Perfil de usuario con ID "${auth0Id}" no encontrado.`,
      );
    }

    const updateData: Partial<User> = {};
    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }
    if (updateUserDto.picture !== undefined) {
      updateData.picture = updateUserDto.picture;
    }

    // Aquí solo se permiten name y picture para updateMe
    if (
      updateUserDto.role_id !== undefined ||
      updateUserDto.is_blocked !== undefined ||
      updateUserDto.deleted_at !== undefined ||
      updateUserDto.email !== undefined ||
      updateUserDto.admin_permissions !== undefined
    ) {
      throw new ForbiddenException(
        'No tienes permiso para modificar estos campos del perfil. Solo puedes actualizar tu nombre y foto.',
      );
    }

    const updateResult = await this.userRepository.update(auth0Id, updateData);

    if (updateResult.affected === 0) {
      this.logger.warn(
        `updateMe(): No se pudo actualizar el perfil del usuario ${auth0Id} (posiblemente ningún cambio o usuario no encontrado).`,
      );
    }

    this.logger.log(`updateMe(): Perfil del usuario ${auth0Id} actualizado.`);
    return this.userRepository.findOneByAuth0Id(auth0Id);
  }

  async findByEmail(email: string): Promise<User> {
    this.logger.debug(`findByEmail(): Buscando usuario con email: ${email}.`);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(
        `Usuario con email "${email}" no encontrado.`,
      );
    }
    return user;
  }

  async findAll(
    paginationOptions: PaginationDto,
    orderOptions: OrderDto,
    includeDeleted: boolean = false,
    filterAuth0Id?: string,
    filterEmail?: string,
    filterRoleName?: string,
    filterIsBlocked?: boolean,
  ): Promise<{ users: User[]; total: number }> {
    this.logger.debug(`findAll(): Buscando todos los usuarios.`);
    const { users, total } = await this.userRepository.findAllPaginated(
      paginationOptions,
      orderOptions,
      includeDeleted,
      filterAuth0Id,
      filterEmail,
      filterRoleName,
      filterIsBlocked,
    );
    this.logger.log(`findAll(): Encontrados ${total} usuarios.`);
    return { users, total };
  }

  async findDeactivatedUsers(): Promise<User[]> {
    this.logger.debug(
      `findDeactivatedUsers(): Buscando usuarios desactivados.`,
    );
    const users = await this.userRepository.findDeactivatedUsers();
    this.logger.log(
      `findDeactivatedUsers(): Encontrados ${users.length} usuarios desactivados.`,
    );
    return users;
  }

  async findOne(
    auth0Id: string,
    includeDeleted: boolean = false,
  ): Promise<User> {
    this.logger.debug(`findOne(): Buscando usuario con ID: ${auth0Id}.`);
    const user = await this.userRepository.findOneByAuth0Id(
      auth0Id,
      includeDeleted,
    );
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${auth0Id}" no encontrado.`);
    }
    this.logger.log(`findOne(): Usuario ${auth0Id} encontrado.`);
    return user;
  }

  async update(
    auth0Id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    this.logger.debug(`update(): Actualizando usuario con ID: ${auth0Id}.`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionalUserRepository =
        queryRunner.manager.getRepository(User);
      const transactionalRolesRepository =
        queryRunner.manager.getRepository(Role);
      const transactionalAdminRepository =
        queryRunner.manager.getRepository(Admin);

      let user = await transactionalUserRepository.findOne({
        where: { auth0_id: auth0Id },
        relations: ['role', 'admin'],
        withDeleted: true,
      });

      if (!user) {
        this.logger.warn(
          `update(): Usuario con ID "${auth0Id}" no encontrado para actualización transaccional.`,
        );
        throw new NotFoundException(
          `Usuario con ID "${auth0Id}" no encontrado.`,
        );
      }

      const oldRole = user.role;
      let newRole: Role | undefined = oldRole;

      if (updateUserDto.role_id) {
        const requestedNewRole = await transactionalRolesRepository.findOne({
          where: { role_id: updateUserDto.role_id },
        });

        if (!requestedNewRole) {
          this.logger.warn(
            `update(): Rol con ID "${updateUserDto.role_id}" no encontrado.`,
          );
          throw new BadRequestException(
            `El ID de rol "${updateUserDto.role_id}" no es válido.`,
          );
        }

        const isOldRoleAdminOrSuperadmin =
          oldRole?.name === 'admin' || oldRole?.name === 'superadmin';
        const isRequestedNewRoleAdminOrSuperadmin =
          requestedNewRole.name === 'admin' ||
          requestedNewRole.name === 'superadmin';

        // Lógica para PROHIBIR la promoción a admin/superadmin a través de esta ruta PATCH
        if (
          !isOldRoleAdminOrSuperadmin &&
          isRequestedNewRoleAdminOrSuperadmin
        ) {
          this.logger.warn(
            `update(): Intento de promover a usuario ${auth0Id} a rol administrativo (${requestedNewRole.name}) a través de la ruta PATCH. Esto no está permitido.`,
          );
          throw new ForbiddenException(
            'No se permite promover usuarios a roles administrativos a través de esta ruta. Use la ruta de administración de administradores.',
          );
        }

        newRole = requestedNewRole;
      }

      // Verificar si se intenta cambiar el email a uno ya existente por otro usuario
      if (
        updateUserDto.email !== undefined &&
        updateUserDto.email !== user.email
      ) {
        const existingUserWithEmail = await transactionalUserRepository.findOne(
          {
            where: { email: updateUserDto.email, auth0_id: Not(auth0Id) },
          },
        );
        if (existingUserWithEmail) {
          this.logger.warn(
            `update(): Conflicto: El email "${updateUserDto.email}" ya está en uso por otro usuario.`,
          );
          throw new ConflictException(
            `El email "${updateUserDto.email}" ya está en uso por otro usuario.`,
          );
        }
        user.email = updateUserDto.email;
      }

      // Preparar los datos para la actualización directa
      const partialUpdateData: Partial<User> = {
        name: updateUserDto.name !== undefined ? updateUserDto.name : user.name,
        picture:
          updateUserDto.picture !== undefined
            ? updateUserDto.picture
            : user.picture,
        is_blocked:
          updateUserDto.is_blocked !== undefined
            ? updateUserDto.is_blocked
            : user.is_blocked,
        deleted_at:
          updateUserDto.deleted_at !== undefined
            ? updateUserDto.deleted_at
            : user.deleted_at,
        role_id: newRole?.role_id, // Asegurarse de que el role_id se actualice
      };

      // Realizar la actualización directa
      await transactionalUserRepository.update(auth0Id, partialUpdateData);

      // Re-cargar el usuario para obtener los datos más recientes, incluyendo las relaciones
      const finalUser = await transactionalUserRepository.findOne({
        where: { auth0_id: auth0Id },
        relations: ['role', 'admin'],
        withDeleted: true,
      });

      if (!finalUser) {
        this.logger.error(
          `update(): No se pudo recuperar el usuario ${auth0Id} después de la actualización.`,
        );
        throw new InternalServerErrorException(
          'Failed to retrieve user after update.',
        );
      }

      const finalRoleName = finalUser.role?.name;
      const hasAdminEntry = finalUser.admin !== null;

      // Lógica para gestionar la entrada en la tabla 'admins'
      if (finalRoleName === 'admin' || finalRoleName === 'superadmin') {
        this.logger.debug(
          `update(): El rol final es ${finalRoleName}. Asegurando entrada en tabla 'admins'.`,
        );
        await this.adminService.createOrUpdateAdminEntry(
          finalUser.auth0_id,
          updateUserDto.admin_permissions || {
            content_permission: true,
            user_permission: true,
            moderation_permission: true,
          },
          queryRunner,
        );
      } else if (hasAdminEntry) {
        this.logger.debug(
          `update(): El rol final (${finalRoleName}) no es admin/superadmin, pero tiene una entrada en 'admins'. Eliminando entrada.`,
        );
        await this.adminService.deleteAdminEntry(
          finalUser.auth0_id,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `update(): Transacción de actualización de usuario ${auth0Id} completada exitosamente.`,
      );

      return plainToInstance(UserDto, finalUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `update(): Error durante la transacción de actualización de usuario ${auth0Id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update user due to an internal error.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async softDeleteUser(auth0Id: string): Promise<void> {
    this.logger.debug(
      `softDeleteUser(): Desactivando usuario con ID: ${auth0Id}.`,
    );
    const user = await this.userRepository.findOneByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${auth0Id}" no encontrado.`);
    }
    if (user.deleted_at !== null) {
      throw new BadRequestException(
        `El usuario con ID "${auth0Id}" ya está desactivado.`,
      );
    }

    if (user.role?.name === 'admin' || user.role?.name === 'superadmin') {
      this.logger.debug(
        `softDeleteUser(): Usuario ${auth0Id} es admin/superadmin. Eliminando entrada de 'admins'.`,
      );
      await this.adminService.deleteAdminEntry(auth0Id);
    }

    await this.userRepository.softDelete(auth0Id);
    this.logger.log(
      `softDeleteUser(): Usuario ${auth0Id} desactivado exitosamente.`,
    );
  }

  async reactivateUser(auth0Id: string): Promise<User> {
    this.logger.debug(
      `reactivateUser(): Reactivando usuario con ID: ${auth0Id}.`,
    );
    const user = await this.userRepository.findOneByAuth0Id(auth0Id, true);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${auth0Id}" no encontrado.`);
    }
    if (user.deleted_at === null) {
      throw new BadRequestException(
        `El usuario con ID "${auth0Id}" ya está activo.`,
      );
    }

    await this.userRepository.reactivate(auth0Id);
    this.logger.log(
      `reactivateUser(): Usuario ${auth0Id} reactivado exitosamente.`,
    );
    return this.userRepository.findOneByAuth0Id(auth0Id, false);
  }
}
