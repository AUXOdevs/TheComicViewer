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
import { Auth0UserProvisionDto } from './dto/auth0-user-provision.dto'; // Importa el nuevo DTO

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
  // Ahora recibe Auth0UserProvisionDto como guía para el payload, pero usa sus propiedades directamente.
  // Retorna la ENTIDAD User
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

    // Auth0 ID ya viene en el formato correcto (ej. 'google-oauth2|...').
    // No necesitamos prefijar 'auth0|' aquí.
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
        userInDb = await this.userRepository.save(userInDb); // Guarda y retorna la entidad actualizada
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

  // Ahora create retorna la ENTIDAD User
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug(
      'create(): Intentando crear o provisionar usuario en DB local.',
    );
    // Ya no agregamos 'auth0|' aquí si viene del frontend, asumiendo que ya viene formateado
    const processedAuth0Id = createUserDto.auth0_id;

    let existingUserByAuth0Id = await this.userRepository.findByAuth0Id(
      processedAuth0Id,
      true, // Incluir eliminados
    );

    if (existingUserByAuth0Id) {
      if (existingUserByAuth0Id.deleted_at) {
        this.logger.log(
          `create(): Usuario con Auth0 ID "${processedAuth0Id}" está desactivado. Reactivando.`,
        );
        return this.reactivateUser(processedAuth0Id); // reactivateUser devuelve User con relaciones
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
      true, // Incluir eliminados
    );

    if (existingUserByEmail) {
      if (existingUserByEmail.deleted_at) {
        this.logger.log(
          `create(): Usuario con email "${createUserDto.email}" está desactivado. Reactivando.`,
        );
        return this.reactivateUser(existingUserByEmail.auth0_id!); // <-- ¡Asegúrate que auth0_id no sea nulo aquí!
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
      // Asigna el rol 'Registrado' por defecto si no se proporciona uno
      role = await this.rolesRepository.findByName('Registrado');
      if (!role) {
        this.logger.warn(
          'create(): Rol por defecto "Registrado" no encontrado. Asegúrate de que existe en la DB y crea uno si es necesario.',
        );
        // Si el rol "Registrado" no existe, considera cómo quieres manejarlo:
        // - Lanzar un error para forzar al admin a crearlo.
        // - Crear el rol "Registrado" programáticamente si no existe (SuperadminService lo hace).
        // - Asignar null y dejar el rol sin definir (menos recomendado).
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
      // created_at se establece automáticamente con @CreateDateColumn
      is_blocked: false, // Por defecto no bloqueado
      deleted_at: null, // Por defecto no eliminado
    });

    const savedUser = await this.userRepository.save(userEntity);
    this.logger.log(
      `create(): Usuario "${savedUser.email}" guardado exitosamente en la DB local.`,
    );

    // Debido a que findUserWithRole (ahora findByAuth0Id) carga eager la relación 'admin',
    // el usuario retornado debería tenerla si existe.
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
    return userWithRoleAndAdmin; // Retorna la entidad User completa
  }

  async findAll(includeDeleted = false): Promise<UserDto[]> {
    this.logger.debug(
      `findAll(): Buscando todos los usuarios (incluir eliminados: ${includeDeleted}).`,
    );
    const users = await this.userRepository.findAll(includeDeleted); // Este findAll ahora carga admin y role
    return plainToInstance(UserDto, users);
  }

  async findDeactivatedUsers(): Promise<UserDto[]> {
    this.logger.debug(
      'findDeactivatedUsers(): Buscando usuarios desactivados.',
    );
    const users = await this.userRepository.findDeactivatedUsers(); // Este también carga admin y role
    return plainToInstance(UserDto, users);
  }

  // Ahora findOne retorna UserDto
  async findOne(id: string, includeDeleted = false): Promise<UserDto> {
    this.logger.debug(
      `findOne(): Buscando usuario por ID "${id}" (incluir eliminados: ${includeDeleted}).`,
    );
    // Este findUserWithRole ahora carga admin y role
    const user = await this.userRepository.findUserWithRole(id, includeDeleted);
    if (!user) {
      this.logger.warn(`findOne(): Usuario con ID "${id}" no encontrado.`);
      throw new NotFoundException(
        `User with ID "${id}" not found or does not meet criteria.`,
      );
    }
    return plainToInstance(UserDto, user); // Retorna DTO
  }

  // findByEmail y findByAuth0IdForAuth retornan la entidad User
  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<User | null> {
    this.logger.debug(
      `findByEmail(): Buscando usuario por email "${email}" (incluir eliminados: ${includeDeleted}).`,
    );
    const user = await this.userRepository.findByEmail(email, includeDeleted); // Este también carga admin y role
    return user;
  }

  async findByAuth0IdForAuth(auth0Id: string): Promise<User | null> {
    this.logger.debug(
      `findByAuth0IdForAuth(): Buscando usuario con Auth0 ID "${auth0Id}".`,
    );
    const user = await this.userRepository.findByAuth0Id(auth0Id, true); // Este también carga admin y role
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    this.logger.debug(`update(): Actualizando usuario con ID "${id}".`);
    // Asegurarse de cargar el rol y el admin para las verificaciones
    const user = await this.userRepository.findUserWithRole(id, true); // Incluir eliminados para actualizar
    if (!user) {
      this.logger.warn(
        `update(): Usuario con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    if (user.deleted_at && updateUserDto.deleted_at === undefined) {
      // No permitir update si está soft-deleted a menos que se esté reactivando
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

    const { auth0_id, email, ...allowedUpdates } = updateUserDto as any; // No permitir actualización directa de auth0_id o email

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

    // Manejar deleted_at explícitamente para reactivación/desactivación
    if (updateUserDto.deleted_at !== undefined) {
      if (updateUserDto.deleted_at === null && user.deleted_at !== null) {
        // Se intenta reactivar
        user.deleted_at = null;
        user.last_login = new Date(); // Actualizar last_login al reactivar
        this.logger.log(`update(): Usuario ${user.email} reactivado.`);
      } else if (
        updateUserDto.deleted_at instanceof Date &&
        user.deleted_at === null
      ) {
        // Se intenta desactivar
        user.deleted_at = new Date();
        this.logger.log(`update(): Usuario ${user.email} desactivado.`);
      }
      // Si no se cambia, o ya estaba en el estado deseado, no hacer nada
    }

    // Aplicar las actualizaciones permitidas
    Object.assign(user, allowedUpdates);

    const updatedUser = await this.userRepository.save(user);
    this.logger.log(
      `update(): Usuario "${updatedUser.email}" actualizado exitosamente.`,
    );

    // Recuperar el usuario con sus relaciones completas para asegurar que el DTO esté bien
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

  // softDeleteUser y reactivateUser ahora usan el User entity completo
  async softDeleteUser(auth0_id: string): Promise<void> {
    this.logger.debug(
      `softDeleteUser(): Realizando soft delete para usuario con Auth0 ID "${auth0_id}".`,
    );
    const user = await this.userRepository.findByAuth0Id(auth0_id, false); // Solo usuarios activos
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
          `Active user with ID "${auth0_id}" not found for soft deletion (possibly already deactivated).`, // Texto más claro
        );
      }

      // Eliminar permisos de admin si el usuario desactivado era admin
      const adminEntry = await this.adminService.findByUserIdInternal(auth0_id);
      if (adminEntry) {
        this.logger.log(
          `softDeleteUser(): Eliminando permisos de admin para "${auth0_id}" durante soft delete.`,
        );
        // Usar removeAdminPermissionsByUserIdInternal con el queryRunner
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
    // Retorna User, no UserDto
    this.logger.debug(
      `reactivateUser(): Reactivando usuario con Auth0 ID "${auth0_id}".`,
    );
    const user = await this.userRepository.findByAuth0Id(auth0_id, true); // Incluir eliminados para encontrarlo
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

    // Asegurarse de que el usuario retornado tiene todas las relaciones cargadas
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
    return userWithRoleAndAdmin; // Retorna la entidad User completa
  }
}
