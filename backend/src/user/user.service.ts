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
import { DataSource, Not, QueryRunner, Repository } from 'typeorm'; // Añadido Repository para tipado en métodos privados

// Constantes para los nombres de roles
const ROLE_REGISTERED = 'Registrado';
const ROLE_SUBSCRIBED = 'Suscrito'; // Si tienes un rol 'Suscrito'
const ROLE_ADMIN = 'admin';
const ROLE_SUPERADMIN = 'superadmin';

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
      await this.rolesRepository.findByName(ROLE_REGISTERED); // Usar constante
    if (!defaultRole) {
      this.logger.error(
        `El rol "${ROLE_REGISTERED}" no fue encontrado. Asegúrate de que los roles por defecto estén en la DB.`,
      );
      throw new BadRequestException(
        `Role "${ROLE_REGISTERED}" not found in database.`,
      );
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

  async findMe(auth0Id: string): Promise<UserDto> {
    // <-- Cambiado a UserDto
    this.logger.debug(`findMe(): Buscando perfil para el usuario ${auth0Id}.`);
    const user = await this.userRepository.findOneByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException(
        `Perfil de usuario con ID "${auth0Id}" no encontrado.`,
      );
    }
    return plainToInstance(UserDto, user); // <-- Transformado a DTO
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

  // `update` para admins, maneja cambios de rol, bloqueo, etc.
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

      // 1. Manejar la actualización del rol
      if (updateUserDto.role_id) {
        newRole = await this._handleRoleUpdate(
          user,
          updateUserDto,
          transactionalRolesRepository,
        );
      }

      // 2. Manejar la actualización del email
      if (
        updateUserDto.email !== undefined &&
        updateUserDto.email !== user.email
      ) {
        await this._handleEmailUpdate(
          user,
          updateUserDto,
          transactionalUserRepository,
          auth0Id,
        );
      }

      // 3. Aplicar otras actualizaciones directas al usuario
      this._applyDirectUserUpdates(user, updateUserDto, newRole);

      // Realizar la actualización directa en la base de datos
      await transactionalUserRepository.update(auth0Id, {
        name: user.name,
        email: user.email,
        picture: user.picture,
        is_blocked: user.is_blocked,
        deleted_at: user.deleted_at,
        role_id: user.role_id, // Asegurarse de que el role_id se actualice
      });

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

      // 4. Sincronizar la entrada de admin
      await this._syncAdminEntry(finalUser, updateUserDto, queryRunner);

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

    if (user.role?.name === ROLE_ADMIN || user.role?.name === ROLE_SUPERADMIN) {
      // Usar constantes
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

  // --- Métodos privados de ayuda para el método update ---

  private async _handleRoleUpdate(
    user: User,
    updateUserDto: UpdateUserDto,
    transactionalRolesRepository: Repository<Role>,
  ): Promise<Role> {
    const requestedNewRole = await transactionalRolesRepository.findOne({
      where: { role_id: updateUserDto.role_id },
    });

    if (!requestedNewRole) {
      this.logger.warn(
        `_handleRoleUpdate(): Rol con ID "${updateUserDto.role_id}" no encontrado.`,
      );
      throw new BadRequestException(
        `El ID de rol "${updateUserDto.role_id}" no es válido.`,
      );
    }

    const isOldRoleAdminOrSuperadmin =
      user.role?.name === ROLE_ADMIN || user.role?.name === ROLE_SUPERADMIN;
    const isRequestedNewRoleAdminOrSuperadmin =
      requestedNewRole.name === ROLE_ADMIN ||
      requestedNewRole.name === ROLE_SUPERADMIN;

    // Lógica para PROHIBIR la promoción a admin/superadmin a través de esta ruta PATCH
    if (!isOldRoleAdminOrSuperadmin && isRequestedNewRoleAdminOrSuperadmin) {
      this.logger.warn(
        `_handleRoleUpdate(): Intento de promover a usuario ${user.auth0_id} a rol administrativo (${requestedNewRole.name}) a través de la ruta PATCH. Esto no está permitido.`,
      );
      throw new ForbiddenException(
        'No se permite promover usuarios a roles administrativos a través de esta ruta. Use la ruta de administración de administradores.',
      );
    }

    user.role = requestedNewRole;
    user.role_id = requestedNewRole.role_id;
    return requestedNewRole;
  }

  private async _handleEmailUpdate(
    user: User,
    updateUserDto: UpdateUserDto,
    transactionalUserRepository: Repository<User>,
    auth0Id: string,
  ): Promise<void> {
    const existingUserWithEmail = await transactionalUserRepository.findOne({
      where: { email: updateUserDto.email, auth0_id: Not(auth0Id) },
    });
    if (existingUserWithEmail) {
      this.logger.warn(
        `_handleEmailUpdate(): Conflicto: El email "${updateUserDto.email}" ya está en uso por otro usuario.`,
      );
      throw new ConflictException(
        `El email "${updateUserDto.email}" ya está en uso por otro usuario.`,
      );
    }
    user.email = updateUserDto.email;
  }

  private _applyDirectUserUpdates(
    user: User,
    updateUserDto: UpdateUserDto,
    newRole: Role | undefined, // Se pasa el newRole para asegurar su actualización
  ): void {
    if (updateUserDto.name !== undefined) user.name = updateUserDto.name;
    if (updateUserDto.picture !== undefined)
      user.picture = updateUserDto.picture;
    if (updateUserDto.is_blocked !== undefined)
      user.is_blocked = updateUserDto.is_blocked;
    if (updateUserDto.deleted_at !== undefined)
      user.deleted_at = updateUserDto.deleted_at;

    // Asegurarse de que el rol se actualice en el objeto de usuario en memoria
    if (newRole && newRole.role_id !== user.role_id) {
      user.role = newRole;
      user.role_id = newRole.role_id;
    }
  }

  private async _syncAdminEntry(
    finalUser: User,
    updateUserDto: UpdateUserDto,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const finalRoleName = finalUser.role?.name;
    const hasAdminEntry = finalUser.admin !== null;

    if (finalRoleName === ROLE_ADMIN || finalRoleName === ROLE_SUPERADMIN) {
      // Usar constantes
      this.logger.debug(
        `_syncAdminEntry(): El rol final es ${finalRoleName}. Asegurando entrada en tabla 'admins'.`,
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
        `_syncAdminEntry(): El rol final (${finalRoleName}) no es admin/superadmin, pero tiene una entrada en 'admins'. Eliminando entrada.`,
      );
      await this.adminService.deleteAdminEntry(finalUser.auth0_id, queryRunner);
    }
  }
}
