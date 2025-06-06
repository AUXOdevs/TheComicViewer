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

  // Nuevo método para encontrar o crear/reactivar el usuario en la DB local al iniciar sesión
  // Retorna la ENTIDAD User, no el DTO
  async findOrCreateUserFromAuth0(
    auth0Id: string,
    email: string,
    name: string,
    emailVerified: boolean = false,
    picture: string | null = null,
  ): Promise<User> {
    // <-- CAMBIO CLAVE: Retorna User
    this.logger.debug(
      `findOrCreateUserFromAuth0: Procesando usuario con Auth0 ID "${auth0Id}" y email "${email}".`,
    );

    const processedAuth0Id = auth0Id.startsWith('auth0|')
      ? auth0Id
      : `auth0|${auth0Id}`;

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
        // reactivateUser ahora retorna User, por lo que podemos asignarlo directamente
        userInDb = await this.reactivateUser(processedAuth0Id);
      }

      // Actualizar datos del perfil si cambiaron en Auth0 y actualizar last_login
      let needsUpdate = false;
      if (userInDb.name !== name) {
        userInDb.name = name;
        needsUpdate = true;
      }
      if (userInDb.email_verified !== emailVerified) {
        userInDb.email_verified = emailVerified;
        needsUpdate = true;
      }
      if (userInDb.picture !== picture) {
        userInDb.picture = picture;
        needsUpdate = true;
      }

      // Actualizar last_login en cada login exitoso
      userInDb.last_login = new Date();
      needsUpdate = true; // Forzar la actualización para registrar el last_login

      if (needsUpdate) {
        this.logger.debug(
          `findOrCreateUserFromAuth0: Actualizando datos de perfil para "${userInDb.email}".`,
        );
        userInDb = await this.userRepository.save(userInDb); // Guarda los cambios y actualiza userInDb
      }
      return userInDb; // <-- Retorna la entidad User
    }

    this.logger.log(
      `findOrCreateUserFromAuth0: Usuario con Auth0 ID "${processedAuth0Id}" NO encontrado. Creando nuevo usuario...`,
    );

    // Si el usuario no existe, crearlo. `create` ahora retorna User.
    const newUserDto: CreateUserDto = {
      auth0_id: processedAuth0Id,
      email: email,
      name: name,
      email_verified: emailVerified,
      picture: picture,
      // role_id se asignará a 'Registrado' por defecto en el método create
    };
    return this.create(newUserDto); // <-- Llama a create, que ahora retorna User
  }

  // Ahora create retorna la ENTIDAD User
  async create(createUserDto: CreateUserDto): Promise<User> {
    // <-- CAMBIO CLAVE: Retorna User
    this.logger.debug(
      'create(): Intentando crear o provisionar usuario en DB local.',
    );
    const processedAuth0Id = createUserDto.auth0_id?.startsWith('auth0|')
      ? createUserDto.auth0_id
      : `auth0|${createUserDto.auth0_id}`;

    let existingUserByAuth0Id = await this.userRepository.findByAuth0Id(
      processedAuth0Id,
      true,
    );

    if (existingUserByAuth0Id) {
      if (existingUserByAuth0Id.deleted_at) {
        this.logger.log(
          `create(): Usuario con Auth0 ID "${processedAuth0Id}" está desactivado. Reactivando.`,
        );
        return this.reactivateUser(processedAuth0Id); // <-- reactivateUser ahora retorna User
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
        return this.reactivateUser(existingUserByEmail.auth0_id); // <-- reactivateUser ahora retorna User
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
          'create(): Rol por defecto "Registrado" no encontrado. El usuario será creado sin un rol específico.',
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
    });

    const savedUser = await this.userRepository.save(userEntity);
    this.logger.log(
      `create(): Usuario "${savedUser.email}" guardado exitosamente en la DB local.`,
    );

    const userWithRole = await this.userRepository.findUserWithRole(
      savedUser.auth0_id,
    );
    if (!userWithRole) {
      this.logger.error(
        'create(): Falló al recuperar usuario después de la creación con rol.',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user after creation with role.',
      );
    }
    this.logger.debug(
      'create(): Usuario creado/provisionado y recuperado con rol.',
    );
    return userWithRole; // <-- Retorna la entidad User directamente
  }

  // findAll sigue retornando UserDto para la respuesta de la API
  async findAll(includeDeleted = false): Promise<UserDto[]> {
    this.logger.debug(
      `findAll(): Buscando todos los usuarios (incluir eliminados: ${includeDeleted}).`,
    );
    const users = await this.userRepository.findAll(includeDeleted);
    return plainToInstance(UserDto, users);
  }

  // findDeactivatedUsers sigue retornando UserDto para la respuesta de la API
  async findDeactivatedUsers(): Promise<UserDto[]> {
    this.logger.debug(
      'findDeactivatedUsers(): Buscando usuarios desactivados.',
    );
    const users = await this.userRepository.findDeactivatedUsers();
    return plainToInstance(UserDto, users);
  }

  // findOne sigue retornando UserDto para la respuesta de la API
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

  // findByEmail ahora retorna la ENTIDAD User o null
  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<User | null> {
    // <-- CAMBIO CLAVE: Retorna User | null
    this.logger.debug(
      `findByEmail(): Buscando usuario por email "${email}" (incluir eliminados: ${includeDeleted}).`,
    );
    const user = await this.userRepository.findByEmail(email, includeDeleted);
    return user; // <-- Retorna la entidad User directamente
  }

  // findByAuth0IdForAuth ahora retorna la ENTIDAD User o null
  async findByAuth0IdForAuth(auth0Id: string): Promise<User | null> {
    // <-- CAMBIO CLAVE: Retorna User | null
    this.logger.debug(
      `findByAuth0IdForAuth(): Buscando usuario con Auth0 ID "${auth0Id}".`,
    );
    const user = await this.userRepository.findByAuth0Id(auth0Id, true);
    return user; // <-- Retorna la entidad User directamente
  }

  // update sigue retornando UserDto para la respuesta de la API
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    this.logger.debug(`update(): Actualizando usuario con ID "${id}".`);
    const user = await this.userRepository.findUserWithRole(id, false);
    if (!user) {
      this.logger.warn(
        `update(): Usuario activo con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Active user with ID "${id}" not found.`);
    }
    if (user.deleted_at) {
      this.logger.warn(
        `update(): Usuario con ID "${id}" está desactivado y no puede ser actualizado.`,
      );
      throw new BadRequestException(
        `User with ID "${id}" is deactivated and cannot be updated.`,
      );
    }

    const { auth0_id, email, deleted_at, ...allowedUpdates } =
      updateUserDto as any;

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
    Object.assign(user, allowedUpdates);

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(
      `update(): Usuario "${updatedUser.email}" actualizado exitosamente.`,
    );

    const userWithRole = await this.userRepository.findUserWithRole(
      updatedUser.auth0_id,
    );
    if (!userWithRole) {
      this.logger.error(
        'update(): Falló al recuperar usuario después de la actualización.',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user after update.',
      );
    }
    return plainToInstance(UserDto, userWithRole);
  }

  // softDeleteUser sigue retornando void
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
          `Active user with ID "${auth0_id}" not found for soft deletion (possibly already deleted).`,
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

  // reactivateUser ahora retorna la ENTIDAD User
  async reactivateUser(auth0_id: string): Promise<User> {
    // <-- CAMBIO CLAVE: Retorna User
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
    user.last_login = new Date(); // Actualizar last_login al reactivar

    const reactivatedUser = await this.userRepository.save(user);
    this.logger.log(
      `reactivateUser(): Usuario "${reactivatedUser.email}" reactivado exitosamente.`,
    );

    const userWithRole = await this.userRepository.findUserWithRole(
      reactivatedUser.auth0_id,
    );
    if (!userWithRole) {
      this.logger.error(
        'reactivateUser(): Falló al recuperar usuario después de la reactivación.',
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user after reactivation.',
      );
    }
    return userWithRole;
  }
}
