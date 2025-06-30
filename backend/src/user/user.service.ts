import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { RolesRepository } from '../roles/roles.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AdminService } from 'src/admins/admins.service';
import { Role } from '../roles/entities/role.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderDto } from 'src/common/dto/order.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly rolesRepository: RolesRepository,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,
  ) {}

  // <<-- ESTE ES EL MÉTODO createInitialUser CORREGIDO -->>
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

    // 1. Intentar encontrar el usuario por Auth0 ID (incluyendo soft-deleted)
    let user = await this.userRepository.findOneByAuth0Id(auth0Id, true);

    if (user) {
      // Si el usuario existe
      if (user.deleted_at !== null) {
        // Si está soft-deleted, reactivarlo
        this.logger.log(
          `createInitialUser(): Reactivando usuario existente "${email}" (Auth0 ID: ${auth0Id}).`,
        );
        await this.userRepository.reactivate(auth0Id);
        // Volver a cargar el usuario reactivado para asegurar que las relaciones (role, admin) estén actualizadas
        // Es crucial obtener la entidad fresca después de la reactivación.
        user = await this.userRepository.findOneByAuth0Id(auth0Id, false);
      }
      // Si el usuario existe y está activo (o acaba de ser reactivado), simplemente retornarlo.
      // ESTO ES LO CLAVE: NO SE LANZA ConflictException AQUÍ.
      this.logger.log(
        `createInitialUser(): Usuario "${email}" (ID: ${auth0Id}) ya existe y está activo. Retornando usuario existente.`,
      );
      return user; // <<-- LA DIFERENCIA CRÍTICA ESTÁ AQUÍ
    }

    // 2. Si el usuario NO existe por Auth0 ID, verificar por email para evitar duplicados en este punto de creación.
    // Esta parte SÍ lanza ConflictException, pero solo si el email está en uso por un Auth0 ID *diferente* (conflicto real).
    const existingByEmail = await this.userRepository.findByEmailSimple(email);
    if (existingByEmail) {
      this.logger.warn(
        `createInitialUser(): Conflicto: Email "${email}" ya en uso por otro Auth0 ID.`,
      );
      throw new ConflictException(`Ya existe un usuario con email "${email}".`);
    }

    // 3. Si no existe por Auth0 ID ni por email (sin conflictos), crear un nuevo usuario.
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
  // <<-- FIN DEL MÉTODO createInitialUser CORREGIDO -->>

  // Obtener el perfil del usuario autenticado (para /users/me)
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

  // Actualizar el perfil del usuario autenticado (para /users/me)
  async updateMe(auth0Id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.debug(
      `updateMe(): Actualizando perfil del usuario ${auth0Id}.`,
    );

    // 1. Validar si el usuario existe antes de intentar actualizar
    const existingUser = await this.userRepository.findOneByAuth0Id(auth0Id);
    if (!existingUser) {
      throw new NotFoundException(
        `Perfil de usuario con ID "${auth0Id}" no encontrado.`,
      );
    }

    // 2. Crear un objeto con solo los campos que se van a actualizar
    const updateData: Partial<User> = {};
    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }
    if (updateUserDto.picture !== undefined) {
      updateData.picture = updateUserDto.picture;
    }

    // 3. Lanzar ForbiddenException si se intenta actualizar campos no permitidos
    // El email es un campo sensible, y se gestiona mejor en otro endpoint o directamente con Auth0.
    if (
      updateUserDto.role_id !== undefined ||
      updateUserDto.is_blocked !== undefined ||
      updateUserDto.deleted_at !== undefined ||
      updateUserDto.email !== undefined // Asegurar que el email tampoco se pueda cambiar por aquí
    ) {
      throw new ForbiddenException(
        'No tienes permiso para modificar estos campos del perfil. Solo puedes actualizar tu nombre y foto.',
      );
    }

    // 4. Realizar la actualización utilizando el método update del repositorio.
    // Este método es más seguro para actualizaciones parciales y para evitar el problema con primary keys.
    const updateResult = await this.userRepository.update(auth0Id, updateData);

    // Verificar si la actualización afectó alguna fila
    if (updateResult.affected === 0) {
      // Aunque ya verificamos la existencia, podría no afectar si no hay cambios.
      // Puedes ajustar esto si prefieres lanzar un NotFoundException aquí si el usuario de repente desaparece.
      this.logger.warn(
        `updateMe(): No se pudo actualizar el perfil del usuario ${auth0Id} (posiblemente ningún cambio o usuario no encontrado).`,
      );
    }

    this.logger.log(`updateMe(): Perfil del usuario ${auth0Id} actualizado.`);
    // 5. Recuperar y retornar el usuario actualizado para asegurar que todas las relaciones y datos estén frescos
    return this.userRepository.findOneByAuth0Id(auth0Id);
  }

  // Buscar por email (para /users/by-email)
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

  // MODIFICADO: Adaptado para usar paginación, ordenación y filtrado
  async findAll(
    paginationOptions: PaginationDto,
    orderOptions: OrderDto,
    includeDeleted: boolean = false,
    filterAuth0Id?: string,
    filterEmail?: string,
    filterRoleName?: string,
    filterIsBlocked?: boolean,
  ): Promise<{ users: User[]; total: number }> {
    // El tipo de retorno es User[] aquí
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
  async update(auth0Id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.debug(`update(): Actualizando usuario con ID: ${auth0Id}.`);
    const user = await this.userRepository.findOneByAuth0Id(auth0Id, true);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${auth0Id}" no encontrado.`);
    }

    // Verificar si se intenta cambiar el email a uno ya existente por otro usuario
    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email !== user.email
    ) {
      const existingUserWithEmail = await this.userRepository.findByEmailSimple(
        updateUserDto.email,
      );
      if (existingUserWithEmail && existingUserWithEmail.auth0_id !== auth0Id) {
        throw new ConflictException(
          `El email "${updateUserDto.email}" ya está en uso por otro usuario.`,
        );
      }
      user.email = updateUserDto.email;
    }

    let role: Role | undefined;
    if (updateUserDto.role_id) {
      role = await this.rolesRepository.findOneById(updateUserDto.role_id);
      if (!role) {
        throw new BadRequestException(
          `El ID de rol "${updateUserDto.role_id}" no es válido.`,
        );
      }
      user.role_id = role.role_id;
      user.role = role;
    }

    user.name =
      updateUserDto.name !== undefined ? updateUserDto.name : user.name;
    user.picture =
      updateUserDto.picture !== undefined
        ? updateUserDto.picture
        : user.picture;
    user.is_blocked =
      updateUserDto.is_blocked !== undefined
        ? updateUserDto.is_blocked
        : user.is_blocked;
    user.deleted_at =
      updateUserDto.deleted_at !== undefined
        ? updateUserDto.deleted_at
        : user.deleted_at;

    const updatedUser = await this.userRepository.save(user);

    if (role && (role.name === 'admin' || role.name === 'superadmin')) {
      await this.adminService.createOrUpdateAdminEntry(updatedUser.auth0_id, {
        user_permission: true,
        content_permission: true,
        moderation_permission: true,
      });
    } else if (user.admin) {
      await this.adminService.deleteAdminEntry(updatedUser.auth0_id);
    }

    this.logger.log(`update(): Usuario ${auth0Id} actualizado exitosamente.`);
    return this.userRepository.findOneByAuth0Id(updatedUser.auth0_id, true);
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
