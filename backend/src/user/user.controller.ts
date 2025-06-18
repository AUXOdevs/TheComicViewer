import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Request,
  UnauthorizedException, // Puede ser útil en casos muy específicos de autenticación
  BadRequestException,
  ConflictException,
  ForbiddenException, // Importar ForbiddenException
  InternalServerErrorException, // Importar InternalServerErrorException
  Logger, // Importar Logger
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from './entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { Auth0UserProvisionDto } from './dto/auth0-user-provision.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'; // Importar de Swagger
import { PermissionsGuard } from 'src/auth/guards/permissions.guard'; // Importar
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator'; // Importar

@ApiTags('users') // Agrupa este controlador bajo la etiqueta 'users' en Swagger
@Controller('users')
// ************ CRÍTICO: REMOVER @UseGuards(JwtAuthGuard) A NIVEL DE CLASE ************
// Cada ruta protegida tendrá sus propios guards.
export class UsersController {
  // Añadir la propiedad logger
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly userService: UserService) {}

  // --- RUTA CLAVE: Aprovisionamiento de usuario desde Auth0 ---
  // Esta ruta NO DEBE ESTAR PROTEGIDA por JwtAuthGuard o RolesGuard.
  // Su propósito es ser el PRIMER punto de contacto para usuarios autenticados por Auth0.
  // El frontend enviará el Access Token, pero este endpoint no lo VALIDARÁ con un guard de JWT.
  // La lógica de `findOrCreateUserFromAuth0` en el servicio es quien maneja la creación/actualización.
  @Post('provision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprovisionar o actualizar usuario desde Auth0',
    description:
      'Endpoint llamado por el frontend después del login de Auth0 para sincronizar/crear el usuario en la base de datos local. No requiere JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario provisionado/actualizado exitosamente.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de Auth0 inválidos.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async provisionUserFromAuth0(
    @Body() payload: Auth0UserProvisionDto,
  ): Promise<UserDto> {
    this.logger.log('🚧 [BACKEND] Ruta /users/provision - Payload recibido:');
    try {
      const user = await this.userService.findOrCreateUserFromAuth0(
        payload.auth0Id,
        payload.email,
        payload.name,
        payload.emailVerified,
        payload.picture,
      );
      this.logger.log(
        '✅ [BACKEND] Usuario provisionado/actualizado en DB interna:',
        user.email,
        'Rol:',
        user.role?.name,
      );
      return plainToInstance(UserDto, user);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to provision user.');
    }
  }

  // --- Rutas protegidas: Ahora cada una NECESITA SU PROPIO @UseGuards(JwtAuthGuard) ---

  @Post('admin-create')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Protegida con JWT, rol y permisos
  @Roles('admin', 'superadmin') // Solo admins y superadmins pueden crear usuarios (sin pasar por Auth0 provision)
  @RequiredPermissions('user_permission') // Requiere permiso de gestión de usuarios
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo usuario por un administrador',
    description:
      'Permite a un **Admin/Superadmin** con permiso de gestión de usuarios crear una nueva entrada de usuario directamente en la base de datos local, asignándole un Auth0 ID.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un usuario con este Auth0 ID o email.',
  })
  async createByAdmin(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    this.logger.log(
      '🚧 [BACKEND] Ruta /users/admin-create - Creando usuario por admin:',
      createUserDto.email,
    );
    const createdUser = await this.userService.create(createUserDto);
    return plainToInstance(UserDto, createdUser);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) // Protegida con JWT y rol
  @Roles('admin', 'superadmin', 'Registrado', 'Suscrito') // Permite a cualquier usuario autenticado ver TODOS los usuarios si tiene permisos o su propio
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir usuarios desactivados (solo Admin/Superadmin).',
  })
  @ApiQuery({
    name: 'auth0Id',
    required: false,
    type: String,
    description: 'Filtrar por Auth0 ID (solo Admin/Superadmin).',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filtrar por email (solo Admin/Superadmin).',
  })
  @ApiOperation({
    summary: 'Obtener lista de usuarios',
    description:
      'Lista todos los usuarios. Un **Admin/Superadmin** puede incluir usuarios desactivados o filtrar por ID/email. Usuarios normales solo ven usuarios activos y no pueden filtrar.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios.',
    type: [UserDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  async findAll(
    @Request() req,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('auth0Id') auth0Id?: string,
    @Query('email') email?: string,
  ): Promise<UserDto[]> {
    this.logger.log('🚧 [BACKEND] Ruta /users - Buscando todos los usuarios.');
    const currentUser = req.user as User;
    const isSuperAdminOrAdmin =
      currentUser.role?.name === 'admin' ||
      currentUser.role?.name === 'superadmin';
    const hasUserPermission =
      isSuperAdminOrAdmin && currentUser.admin?.user_permission;

    // Solo admins/superadmins con user_permission pueden usar includeDeleted, auth0Id o email para filtrar
    const bIncludeDeleted = hasUserPermission && includeDeleted === 'true';
    const filterAuth0Id = hasUserPermission ? auth0Id : undefined;
    const filterEmail = hasUserPermission ? email : undefined;

    // Si no es admin y está intentando filtrar, denegar
    if (!hasUserPermission && (auth0Id || email)) {
      throw new ForbiddenException(
        'You are not authorized to filter users by Auth0 ID or email.',
      );
    }
    // Si no es admin y está intentando incluir eliminados, denegar
    if (!hasUserPermission && includeDeleted === 'true') {
      throw new ForbiddenException(
        'You are not authorized to view deleted users.',
      );
    }

    if (filterAuth0Id) {
      const user = await this.userService.findByAuth0IdForAuth(filterAuth0Id); // Retorna User entity
      return user ? [plainToInstance(UserDto, user)] : [];
    }
    if (filterEmail) {
      const user = await this.userService.findByEmail(filterEmail); // Retorna User entity
      return user ? [plainToInstance(UserDto, user)] : [];
    }

    return this.userService.findAll(bIncludeDeleted);
  }

  @Get('deactivated')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Protegida con JWT, rol y permisos
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission') // Solo Admin/Superadmin con user_permission
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener usuarios desactivados (solo Admin/Superadmin con permiso de usuario)',
    description:
      'Lista todos los usuarios que han sido marcados como desactivados (soft-deleted).',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios desactivados.',
    type: [UserDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  async findDeactivatedUsers(): Promise<UserDto[]> {
    this.logger.log(
      '🚧 [BACKEND] Ruta /users/deactivated - Buscando usuarios desactivados.',
    );
    return this.userService.findDeactivatedUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Protegida con JWT, rol y permisos
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @RequiredPermissions('user_permission') // Este permiso es para que admins/superadmins puedan ver perfiles ajenos
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir perfil si está desactivado (solo Admin/Superadmin).',
  })
  @ApiOperation({
    summary: 'Obtener un usuario por ID',
    description:
      'Recupera los detalles de un usuario específico. Solo el **propietario** o un **Admin/Superadmin** (con permiso de gestión de usuarios) puede acceder. Un Admin/Superadmin también puede incluir perfiles desactivados.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'Auth0 ID del usuario', type: String })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado.',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id - Buscando usuario con ID: ${id}`,
    );
    const currentUser = req.user as User;
    const isSuperAdminOrAdmin =
      currentUser.role?.name === 'admin' ||
      currentUser.role?.name === 'superadmin';
    const hasUserPermission =
      isSuperAdminOrAdmin && currentUser.admin?.user_permission;

    const bIncludeDeleted = hasUserPermission && includeDeleted === 'true';

    // Permite a los superadmin y admin ver cualquier perfil, o al propio usuario ver su perfil.
    if (currentUser.auth0_id !== id && !hasUserPermission) {
      throw new ForbiddenException(
        'You are not authorized to view this user profile.',
      );
    }

    // Permite a los superadmin y admin ver perfiles eliminados.
    if (bIncludeDeleted && !hasUserPermission) {
      // Reafirmación de la guardia
      throw new ForbiddenException(
        'You are not authorized to view deleted user profiles.',
      );
    }

    return this.userService.findOne(id, bIncludeDeleted);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Protegida con JWT, rol y permisos
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder
  @RequiredPermissions('user_permission') // Este permiso es para que admins/superadmins puedan editar perfiles ajenos, o cambiar roles/bloquear
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un usuario por ID',
    description:
      'Permite al **propietario** de la cuenta actualizar su propio perfil. Un **Admin/Superadmin** (con permiso de gestión de usuarios) puede actualizar cualquier perfil, incluyendo cambiar roles, bloquear/desbloquear o reactivar/desactivar.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'Auth0 ID del usuario a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<UserDto> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id - Actualizando usuario con ID: ${id}`,
    );
    const currentUser = req.user as User;
    const isSuperAdminOrAdmin =
      currentUser.role?.name === 'admin' ||
      currentUser.role?.name === 'superadmin';
    const hasUserPermission =
      isSuperAdminOrAdmin && currentUser.admin?.user_permission;

    // Un superadmin o admin con user_permission puede actualizar cualquier perfil.
    // El usuario normal solo puede actualizar el suyo.
    if (currentUser.auth0_id !== id && !hasUserPermission) {
      throw new ForbiddenException(
        'You are not authorized to update this user profile.',
      );
    }

    // Solo un admin o superadmin con user_permission puede cambiar el rol o el estado de bloqueo/eliminación
    if (updateUserDto.role_id !== undefined && !hasUserPermission) {
      throw new ForbiddenException(
        'Only admins or superadmins with user management permission can change user roles.',
      );
    }
    if (updateUserDto.is_blocked !== undefined && !hasUserPermission) {
      throw new ForbiddenException(
        'Only admins or superadmins with user management permission can block/unblock users.',
      );
    }
    if (updateUserDto.deleted_at !== undefined && !hasUserPermission) {
      throw new ForbiddenException(
        'Only admins or superadmins with user management permission can deactivate/reactivate users.',
      );
    }

    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin') // Solo admins y superadmins pueden desactivar usuarios
  @RequiredPermissions('user_permission') // Requiere permiso de gestión de usuarios
  @ApiOperation({
    summary: 'Desactivar (soft-delete) un usuario por ID',
    description:
      'Marca un usuario como desactivado en la base de datos (soft-delete). Solo accesible por **Admin/Superadmin** con permiso de gestión de usuarios. No elimina el registro físicamente.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'Auth0 ID del usuario a desactivar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Usuario desactivado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado o ya desactivado.',
  })
  async softDeleteUser(@Param('id') id: string): Promise<void> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id - Desactivando usuario con ID: ${id}`,
    );
    await this.userService.softDeleteUser(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin') // Solo admins y superadmins pueden reactivar usuarios
  @RequiredPermissions('user_permission') // Requiere permiso de gestión de usuarios
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reactivar un usuario por ID',
    description:
      'Marca un usuario previamente desactivado como activo. Solo accesible por **Admin/Superadmin** con permiso de gestión de usuarios.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'Auth0 ID del usuario a reactivar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario reactivado exitosamente.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Usuario ya activo.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async reactivateUser(@Param('id') id: string): Promise<UserDto> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id/reactivate - Reactivando usuario con ID: ${id}`,
    );
    return this.userService.reactivateUser(id);
  }
}
