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
  Query, // Se mantiene para @Query()
  UseGuards,
  Request,
  BadRequestException, // Se mantiene, usada en validación de permisos
  ConflictException, // Se mantiene, usada en validación de permisos
  ForbiddenException, // Se mantiene, usada en validación de permisos
  InternalServerErrorException, // Se mantiene, usada en manejo de errores
  Logger,
  NotFoundException, // Se mantiene, usada para logs
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from './entities/user.entity';
import { plainToInstance } from 'class-transformer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery, // Se mantiene para decorar Swagger (aunque los parámetros se definan en el DTO)
} from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';
// Importamos directamente GetAllUsersDto, ya no necesitamos PaginationDto ni OrderDto como parámetros de @Query()
import { GetAllUsersDto } from './dto/get-all-users.dto'; // <<-- ¡IMPORTACIÓN CLAVE!
import { AdminService } from 'src/admins/admins.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly userService: UserService,
    private readonly adminService: AdminService, // Se mantiene ya que se usa en otros métodos o para lógica de admin
  ) {}

  // Las importaciones como Post, BadRequestException, ConflictException, InternalServerErrorException
  // y AdminService se mantienen porque son relevantes para el funcionamiento general
  // de otras rutas en este controlador o para un manejo de errores robusto.
  // La ruta `sync-auth0-user` ya fue eliminada, así que el comentario de eliminación está correcto.

  @Get('by-email')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission')
  @ApiOperation({
    summary: 'Buscar usuario por dirección de email',
    description:
      'Permite a un **Admin/Superadmin** con `user_permission` buscar un usuario específico por su dirección de email.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'email',
    description: 'Email del usuario a buscar',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado.',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findUserByEmail(@Query('email') email: string): Promise<UserDto> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/by-email - Buscando por email: ${email}`,
    );
    try {
      const user = await this.userService.findByEmail(email);
      return plainToInstance(UserDto, user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `findUserByEmail(): Usuario con email "${email}" no encontrado.`,
        );
        throw error;
      }
      this.logger.error(
        `findUserByEmail(): Error interno al buscar usuario: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al buscar el usuario.',
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @ApiOperation({
    summary: 'Obtener información del usuario autenticado',
    description:
      'Retorna el perfil completo del usuario que está autenticado en la sesión.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Información del usuario autenticado.',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado (raro si está autenticado).',
  })
  async getAuthenticatedUser(@Request() req): Promise<UserDto> {
    this.logger.log(
      '🚧 [BACKEND] Ruta /users/me - Obteniendo info del usuario autenticado.',
    );
    try {
      const user = req.user as User;
      // Ya aseguramos que el usuario existe en createInitialUser llamado por JwtStrategy
      if (!user) {
        throw new NotFoundException(
          'Usuario autenticado no encontrado en la solicitud.',
        );
      }
      return plainToInstance(UserDto, user);
    } catch (error) {
      this.logger.error(
        `getAuthenticatedUser(): Error al obtener usuario autenticado: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener el perfil del usuario.',
      );
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @ApiOperation({
    summary: 'Actualizar información del usuario autenticado',
    description:
      'Permite al usuario autenticado actualizar su propio nombre y foto de perfil.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Perfil de usuario actualizado exitosamente.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (intento de modificar campos restringidos o perfil ajeno).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async updateAuthenticatedUser(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    this.logger.log(
      '🚧 [BACKEND] Ruta /users/me - Actualizando info del usuario autenticado.',
    );
    try {
      const user = req.user as User;
      const updatedUser = await this.userService.updateMe(
        user.auth0_id,
        updateUserDto,
      );
      return plainToInstance(UserDto, updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `updateAuthenticatedUser(): Error al actualizar perfil: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `updateAuthenticatedUser(): Error interno al actualizar perfil: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al actualizar el perfil del usuario.',
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Obtener lista de usuarios con paginación, filtrado y ordenación',
    description:
      'Lista todos los usuarios en el sistema. Solo accesible por **Admin/Superadmin**. Soporta paginación, ordenación y filtrado por Auth0 ID, email, rol y estado de bloqueo. Los **Admins/Superadmins** con `user_permission` pueden ver usuarios desactivados.',
  })
  @ApiBearerAuth('JWT-auth')
  // <<-- AHORA UN SOLO @Query() DECORATOR CON EL NUEVO DTO -->>
  // Las decoraciones @ApiQuery se mueven al GetAllUsersDto
  // Ya no se repiten aquí, se leerán desde el DTO.
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios con paginación.',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' }) // Añadido
  async findAll(
    @Request() req,
    @Query() queryParams: GetAllUsersDto, // <<-- ¡SOLO ESTO ES NECESARIO AQUÍ!
  ): Promise<{ users: UserDto[]; total: number; page: number; limit: number }> {
    this.logger.log('🚧 [BACKEND] Ruta /users - Buscando usuarios.');
    try {
      const currentUser = req.user as User;
      const isSuperAdminOrAdmin =
        currentUser.role?.name === 'admin' ||
        currentUser.role?.name === 'superadmin';
      const hasUserPermission =
        isSuperAdminOrAdmin && currentUser.admin?.user_permission;

      // Extraer las propiedades del DTO combinado
      const {
        page,
        limit,
        sortBy,
        order,
        includeDeleted,
        auth0Id,
        email,
        roleName,
        isBlocked,
      } = queryParams;

      // La lógica de permisos se mantiene robusta.
      const bIncludeDeleted = hasUserPermission && includeDeleted;
      const filterAuth0Id = hasUserPermission ? auth0Id : undefined;
      const filterEmail = hasUserPermission ? email : undefined;
      const filterRoleName = hasUserPermission ? roleName : undefined;
      const filterIsBlocked =
        hasUserPermission && isBlocked !== undefined ? isBlocked : undefined;

      if (!hasUserPermission) {
        if (includeDeleted) {
          throw new ForbiddenException(
            'No tienes permiso para ver usuarios desactivados.',
          );
        }
        if (auth0Id || email || roleName || isBlocked !== undefined) {
          throw new ForbiddenException(
            'No tienes permiso para usar filtros avanzados de usuarios.',
          );
        }
      }

      // Pasar objetos de paginación y ordenación al servicio, así como los filtros
      const { users, total } = await this.userService.findAll(
        { page, limit },
        { sortBy, order },
        bIncludeDeleted,
        filterAuth0Id,
        filterEmail,
        filterRoleName,
        filterIsBlocked,
      );

      return {
        users: plainToInstance(UserDto, users),
        total,
        page: page || 1, // Asegurarse de que page y limit tengan valores por defecto si no se proporcionan
        limit: limit || 10,
      };
    } catch (error) {
      // Manejo de errores específico para BadRequest, Forbidden, etc., si vienen del servicio
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `findAll(): Error en permisos o parámetros: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `findAll(): Error interno al obtener lista de usuarios: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener la lista de usuarios.',
      );
    }
  }

  @Get('deactivated')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission')
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
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' }) // Añadido
  async findDeactivatedUsers(): Promise<UserDto[]> {
    this.logger.log(
      '🚧 [BACKEND] Ruta /users/deactivated - Buscando usuarios desactivados.',
    );
    try {
      const users = await this.userService.findDeactivatedUsers();
      return plainToInstance(UserDto, users);
    } catch (error) {
      this.logger.error(
        `findDeactivatedUsers(): Error interno al obtener usuarios desactivados: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener la lista de usuarios desactivados.',
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  // Nota: RequiredPermissions('user_permission') aquí significa que Registrados/Suscritos necesitarían user_permission,
  // lo cual generalmente no es el caso. Para que Registrados/Suscritos puedan ver su propio perfil,
  // esta ruta no debería requerir user_permission si se accede al propio ID.
  // La lógica interna de `if (currentUser.auth0_id !== id && !hasUserPermission)` ya maneja esto.
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
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' }) // Añadido
  async findOne(
    @Param('id') id: string,
    @Request() req,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id - Buscando usuario con ID: ${id}`,
    );
    try {
      const currentUser = req.user as User;
      const isSuperAdminOrAdmin =
        currentUser.role?.name === 'admin' ||
        currentUser.role?.name === 'superadmin';
      const hasUserPermission =
        isSuperAdminOrAdmin && currentUser.admin?.user_permission;

      const bIncludeDeleted = hasUserPermission && includeDeleted === 'true';

      if (currentUser.auth0_id !== id && !hasUserPermission) {
        throw new ForbiddenException(
          'No tienes autorización para ver este perfil de usuario.',
        );
      }

      if (bIncludeDeleted && !hasUserPermission) {
        // Esta condición es redundante si hasUserPermission ya la cubre arriba,
        // pero se mantiene para claridad. La comprobación principal `if (!hasUserPermission)`
        // ya debería haber lanzado un error si includeDeleted es true y no tiene el permiso.
        throw new ForbiddenException(
          'No tienes autorización para ver perfiles de usuario desactivados.',
        );
      }

      const user = await this.userService.findOne(id, bIncludeDeleted);
      return plainToInstance(UserDto, user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        this.logger.warn(
          `findOne(): Error al buscar usuario con ID "${id}": ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `findOne(): Error interno al buscar usuario: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener el usuario.',
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un usuario por ID (Solo para Admins/Superadmins)',
    description:
      'Permite a un **Admin/Superadmin** (con permiso de gestión de usuarios) actualizar cualquier perfil de usuario, incluyendo nombre, foto, rol, estado de bloqueo y estado de activación/desactivación.',
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
    description: 'No autorizado (rol o permiso insuficiente para esta acción).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto (ej. email ya en uso).' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' }) // Añadido
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req, // Se mantiene `req` si es necesario para logs o futuras validaciones del usuario que hace la petición
  ): Promise<UserDto> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id - Actualizando usuario con ID: ${id}`,
    );
    try {
      const updatedUser = await this.userService.update(id, updateUserDto);
      return plainToInstance(UserDto, updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        this.logger.warn(
          `update(): Error al actualizar usuario con ID "${id}": ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `update(): Error interno al actualizar usuario: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al actualizar el usuario.',
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission')
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
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' }) // Añadido
  async softDeleteUser(@Param('id') id: string): Promise<void> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id - Desactivando usuario con ID: ${id}`,
    );
    try {
      await this.userService.softDeleteUser(id);
    } catch (error) {
      if (
        error instanceof NotFoundException||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `softDeleteUser(): Error al desactivar usuario con ID "${id}": ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `softDeleteUser(): Error interno al desactivar usuario: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al desactivar el usuario.',
      );
    }
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission')
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
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' }) // Añadido
  async reactivateUser(@Param('id') id: string): Promise<UserDto> {
    this.logger.log(
      `🚧 [BACKEND] Ruta /users/:id/reactivate - Reactivando usuario con ID: ${id}`,
    );
    try {
      const user = await this.userService.reactivateUser(id);
      return plainToInstance(UserDto, user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `reactivateUser(): Error al reactivar usuario con ID "${id}": ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `reactivateUser(): Error interno al reactivar usuario: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al reactivar el usuario.',
      );
    }
  }
}
