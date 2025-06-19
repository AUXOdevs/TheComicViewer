import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { Role } from '../roles/entities/role.entity';
import { RolesRepository } from '../roles/roles.repository';
import { AdminService } from '../admins/admins.service';
import { plainToInstance } from 'class-transformer';
import { User } from './entities/user.entity';
import { DataSource, IsNull } from 'typeorm';
import { Auth0UserProvisionDto } from './dto/auth0-user-provision.dto';

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

  async findOrCreateUserFromAuth0(
    auth0Id: string,
    email: string,
    name: string,
    emailVerified: boolean = false,
    picture: string | null = null,
  ): Promise<User> {
    this.logger.debug(
      `findOrCreateUserFromAuth0: Procesando usuario con Auth0 ID "${auth0Id}" y email "${email}".`,
    );

    const processedAuth0Id = auth0Id;

    // findByAuth0Id ahora carga automáticamente 'admin' y 'role'
    let userInDb = await this.userRepository.findByAuth0Id(
      processedAuth0Id,
      true, // Incluir eliminados para ver si hay que reactivar
    );

    if (userInDb) {
      this.logger.debug(
        `findOrCreateUserFromAuth0: Usuario con Auth0 ID "${processedAuth0Id}" encontrado.`,
      );
      if (userInDb.deleted_at) {
        this.logger.log(
          `findOrCreateUserFromAuth0: Usuario inactivo. Reactivando...`,
        );
        userInDb = await this.reactivateUser(processedAuth0Id); // reactivateUser devuelve User con relaciones
      }

      // ************ CAMBIO CRÍTICO AQUÍ ************
      // Usar un objeto parcial para las actualizaciones y luego el método update directo
      let needsUpdate = false;
      const updatedFields: Partial<User> = {};

      if (userInDb.name !== name) {
        updatedFields.name = name;
        needsUpdate = true;
      }
      if (userInDb.email_verified !== emailVerified) {
        updatedFields.email_verified = emailVerified;
        needsUpdate = true;
      }
      if (userInDb.picture !== picture) {
        updatedFields.picture = picture;
        needsUpdate = true;
      }

      // Siempre actualizar last_login
      updatedFields.last_login = new Date();
      needsUpdate = true; // Forzar la actualización para registrar el last_login

      if (needsUpdate) {
        this.logger.debug(
          `findOrCreateUserFromAuth0: Actualizando datos de perfil para "${userInDb.email}".`,
        );
        // Usar el nuevo método updateUserFields
        await this.userRepository.updateUserFields(
          userInDb.auth0_id,
          updatedFields,
        );

        // Después de la actualización, es vital volver a cargar el usuario completo
        // para asegurarse de que todas las relaciones (role, admin) estén actualizadas y disponibles
        // para el resto del flujo (ej. JwtStrategy, RolesGuard, PermissionsGuard).
        userInDb = await this.userRepository.findByAuth0Id(
          userInDb.auth0_id,
          true,
        );
        if (!userInDb) {
          this.logger.error(
            'findOrCreateUserFromAuth0: Falló al recuperar usuario después de la actualización de campos.',
          );
          throw new InternalServerErrorException(
            'Failed to retrieve user after updating profile fields.',
          );
        }
      }
      return userInDb; // Retorna la entidad User (que ya tiene role y admin eager-loaded si existen)
    }

    this.logger.log(
      `findOrCreateUserFromAuth0: Usuario con Auth0 ID "${processedAuth0Id}" NO encontrado. Creando nuevo usuario...`,
    );

    // Si el usuario no existe, crearlo.
    const newUserDto: CreateUserDto = {
      auth0_id: processedAuth0Id,
      email: email,
      name: name,
      email_verified: emailVerified,
      picture: picture,
      // role_id se asignará a 'Registrado' por defecto en el método create
    };
    return this.create(newUserDto); // Llama a create, que ahora retorna User con sus relaciones
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug(
      'create(): Intentando crear o provisionar usuario en DB local.',
    );
    const processedAuth0Id = createUserDto.auth0_id;

    let existingUserByAuth0Id = await this.userRepository.findByAuth0Id(
      processedAuth0Id,
      true,
    );

    if (existingUserByAuth0Id) {
      if (existingUserByAuth0Id.deleted_at) {
        this.logger.log(
          `create(): Usuario con Auth0 ID "${processedAuth0Id}" está desactivado. Reactivando.`,
        );
        return this.reactivateUser(processedAuth0Id);
      }
      this.logger.warn(
        `create(): Usuario con Auth0 ID "${processedAuth0Id}" ya existe.`,
      );
      throw new ConflictException(
        `User with Auth0 ID "${processedAuth0Id}" already exists.`,
      );
    }

    let existingUserByEmail = await this.userRepository.findByEmail(
      createUserDto.email,
      true,
    );

    if (existingUserByEmail) {
      if (existingUserByEmail.deleted_at) {
        this.logger.log(
          `create(): Usuario con email "${createUserDto.email}" está desactivado. Reactivando.`,
        );
        return this.reactivateUser(existingUserByEmail.auth0_id!);
      }
      this.logger.warn(
        `create(): Usuario con email "${createUserDto.email}" ya existe.`,
      );
      throw new ConflictException(
        `User with email "${createUserDto.email}" already exists.`,
      );
    }

    let role: Role | null = null;
    if (createUserDto.role_id) {
      role = await this.rolesRepository.findOne({
        where: { role_id: createUserDto.role_id },
      });
      if (!role) {
        throw new BadRequestException(
          `Role with ID "${createUserDto.role_id}" not found.`,
        );
      }
    } else {
      role = await this.rolesRepository.findByName('Registrado');
      if (!role) {
        this.logger.warn(
          'create(): Rol por defecto "Registrado" no encontrado. Asegúrate de que existe en la DB y crea uno si es necesario.',
        );
      }
    }

    const userEntity = this.userRepository.create({
      auth0_id: processedAuth0Id,
      name: createUserDto.name || createUserDto.email.split('@')[0],
      email: createUserDto.email,
      email_verified: createUserDto.email_verified || false,
      picture: createUserDto.picture || null,
      role: role,
      role_id: role ? role.role_id : null,
      last_login: new Date(),
      is_blocked: false,
      deleted_at: null,
    });

    const savedUser = await this.userRepository.save(userEntity);
    this.logger.log(
      `create(): Usuario "${savedUser.email}" guardado exitosamente en la DB local.`,
    );

    const userWithRoleAndAdmin = await this.userRepository.findUserWithRole(
      savedUser.auth0_id,
    );
    if (!userWithRoleAndAdmin) {
      this.logger.error(
        'create(): Falló al recuperar usuario después de la creación con rol y admin.',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user after creation with role and admin.',
      );
    }
    this.logger.debug(
      'create(): Usuario creado/provisionado y recuperado con rol y admin.',
    );
    return userWithRoleAndAdmin;
  }

  async findAll(includeDeleted = false): Promise<UserDto[]> {
    this.logger.debug(
      `findAll(): Buscando todos los usuarios (incluir eliminados: ${includeDeleted}).`,
    );
    const users = await this.userRepository.findAll(includeDeleted);
    return plainToInstance(UserDto, users);
  }

  async findDeactivatedUsers(): Promise<UserDto[]> {
    this.logger.debug(
      'findDeactivatedUsers(): Buscando usuarios desactivados.',
    );
    const users = await this.userRepository.findDeactivatedUsers();
    return plainToInstance(UserDto, users);
  }

  async findOne(id: string, includeDeleted = false): Promise<UserDto> {
    this.logger.debug(
      `findOne(): Buscando usuario por ID "${id}" (incluir eliminados: ${includeDeleted}).`,
    );
    const user = await this.userRepository.findUserWithRole(id, includeDeleted);
    if (!user) {
      this.logger.warn(`findOne(): Usuario con ID "${id}" no encontrado.`);
      throw new NotFoundException(
        `User with ID "${id}" not found or does not meet criteria.`,
      );
    }
    return plainToInstance(UserDto, user);
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<User | null> {
    this.logger.debug(
      `findByEmail(): Buscando usuario por email "${email}" (incluir eliminados: ${includeDeleted}).`,
    );
    const user = await this.userRepository.findByEmail(email, includeDeleted);
    return user;
  }

  async findByAuth0IdForAuth(auth0Id: string): Promise<User | null> {
    this.logger.debug(
      `findByAuth0IdForAuth(): Buscando usuario con Auth0 ID "${auth0Id}".`,
    );
    const user = await this.userRepository.findByAuth0Id(auth0Id, true);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    this.logger.debug(`update(): Actualizando usuario con ID "${id}".`);
    const user = await this.userRepository.findUserWithRole(id, true);
    if (!user) {
      this.logger.warn(
        `update(): Usuario con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    if (user.deleted_at && updateUserDto.deleted_at === undefined) {
      this.logger.warn(
        `update(): Usuario con ID "${id}" está desactivado y no puede ser actualizado sin reactivación explícita.`,
      );
      throw new BadRequestException(
        `User with ID "${id}" is deactivated and cannot be updated (reactivate first).`,
      );
    }
    if (user.is_blocked && updateUserDto.is_blocked === undefined) {
      this.logger.warn(
        `update(): Usuario con ID "${id}" está bloqueado y no puede ser actualizado.`,
      );
      throw new BadRequestException(
        `User with ID "${id}" is blocked and cannot be updated.`,
      );
    }

    const { auth0_id, email, ...allowedUpdates } = updateUserDto as any;

    if (allowedUpdates.role_id !== undefined) {
      if (allowedUpdates.role_id === null) {
        user.role = null;
        user.role_id = null;
      } else {
        const newRole = await this.rolesRepository.findOne({
          where: { role_id: allowedUpdates.role_id },
        });
        if (!newRole) {
          throw new BadRequestException(
            `Role with ID "${allowedUpdates.role_id}" not found.`,
          );
        }
        user.role = newRole;
        user.role_id = newRole.role_id;
      }
    }

    if (updateUserDto.deleted_at !== undefined) {
      if (updateUserDto.deleted_at === null && user.deleted_at !== null) {
        user.deleted_at = null;
        user.last_login = new Date();
        this.logger.log(`update(): Usuario ${user.email} reactivado.`);
      } else if (
        updateUserDto.deleted_at instanceof Date &&
        user.deleted_at === null
      ) {
        user.deleted_at = new Date();
        this.logger.log(`update(): Usuario ${user.email} desactivado.`);
      }
    }

    Object.assign(user, allowedUpdates);

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(
      `update(): Usuario "${updatedUser.email}" actualizado exitosamente.`,
    );

    const userWithRoleAndAdmin = await this.userRepository.findUserWithRole(
      updatedUser.auth0_id,
    );
    if (!userWithRoleAndAdmin) {
      this.logger.error(
        'update(): Falló al recuperar usuario después de la actualización.',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user after update.',
      );
    }
    return plainToInstance(UserDto, userWithRoleAndAdmin);
  }

  async softDeleteUser(auth0_id: string): Promise<void> {
    this.logger.debug(
      `softDeleteUser(): Realizando soft delete para usuario con Auth0 ID "${auth0_id}".`,
    );
    const user = await this.userRepository.findByAuth0Id(auth0_id, false);
    if (!user) {
      this.logger.warn(
        `softDeleteUser(): Usuario activo con ID "${auth0_id}" no encontrado para soft delete.`,
      );
      throw new NotFoundException(
        `Active user with ID "${auth0_id}" not found.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateResult = await queryRunner.manager.update(
        User,
        { auth0_id: auth0_id, deleted_at: IsNull() },
        { deleted_at: new Date() },
      );

      if (updateResult.affected === 0) {
        this.logger.warn(
          `softDeleteUser(): Usuario con ID "${auth0_id}" no se pudo desactivar (posiblemente ya desactivado).`,
        );
        throw new NotFoundException(
          `Active user with ID "${auth0_id}" not found for soft deletion (possibly already deactivated).`,
        );
      }

      const adminEntry = await this.adminService.findByUserIdInternal(auth0_id);
      if (adminEntry) {
        this.logger.log(
          `softDeleteUser(): Eliminando permisos de admin para "${auth0_id}" durante soft delete.`,
        );
        await this.adminService.removeAdminPermissionsByUserIdInternal(
          auth0_id,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `softDeleteUser(): Usuario con Auth0 ID "${auth0_id}" desactivado exitosamente.`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'softDeleteUser(): Error durante la transacción de soft delete:',
        error,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Could not deactivate user due to an internal error.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async reactivateUser(auth0_id: string): Promise<User> {
    this.logger.debug(
      `reactivateUser(): Reactivando usuario con Auth0 ID "${auth0_id}".`,
    );
    const user = await this.userRepository.findByAuth0Id(auth0_id, true);
    if (!user) {
      this.logger.warn(
        `reactivateUser(): Usuario con ID "${auth0_id}" no encontrado para reactivar.`,
      );
      throw new NotFoundException(`User with ID "${auth0_id}" not found.`);
    }
    if (!user.deleted_at) {
      this.logger.warn(
        `reactivateUser(): Usuario con ID "${auth0_id}" ya está activo.`,
      );
      throw new BadRequestException(
        `User with ID "${auth0_id}" is already active.`,
      );
    }

    user.deleted_at = null;
    user.last_login = new Date();

    const reactivatedUser = await this.userRepository.save(user);
    this.logger.log(
      `reactivateUser(): Usuario "${reactivatedUser.email}" reactivado exitosamente.`,
    );

    const userWithRoleAndAdmin = await this.userRepository.findUserWithRole(
      reactivatedUser.auth0_id,
    );
    if (!userWithRoleAndAdmin) {
      this.logger.error(
        'reactivateUser(): Falló al recuperar usuario después de la reactivación.',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user after reactivation.',
      );
    }
    return userWithRoleAndAdmin;
  }
}
