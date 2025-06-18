import {
  Controller,
  Get,
  Post,
  Body,
  Patch, // Cambiado de Put a Patch
  Param,
  Delete,
  NotFoundException,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleDto } from './dto/role.dto'; // Asegúrate de que este DTO exista y sea completo
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserDto } from '../user/dto/user.dto'; // Importa UserDto
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Importar
import { RolesGuard } from '../auth/guards/roles.guard'; // Importar
import { Roles } from '../auth/decorators/roles.decorator'; // Importar
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'; // Importar de Swagger
import { PermissionsGuard } from 'src/auth/guards/permissions.guard'; // Importar
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator'; // Importar

@ApiTags('roles') // Agrupa este controlador bajo la etiqueta 'roles' en Swagger
@Controller('roles')
// Aplicar JwtAuthGuard y RolesGuard a nivel de controlador para todas las rutas.
// PermissionsGuard se aplicará solo si la ruta tiene @RequiredPermissions.
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('superadmin') // Solo superadmins pueden crear roles
  @RequiredPermissions('user_permission') // Requiere permiso de gestión de usuarios
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo rol (Solo Superadmin con permiso de usuario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente.',
    type: RoleDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 409, description: 'El nombre del rol ya existe.' })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleDto> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles('admin', 'superadmin') // Admins y superadmins pueden ver todos los roles
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los roles (Solo Admin/Superadmin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de roles.',
    type: [RoleDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  async findAll(): Promise<RoleDto[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'superadmin') // Admins y superadmins pueden ver un rol específico
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un rol por ID (Solo Admin/Superadmin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID único del rol', type: String })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado.',
    type: RoleDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  async findOne(@Param('id') id: string): Promise<RoleDto> {
    const role = await this.rolesService.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return role;
  }

  @Get(':id/users')
  @Roles('admin', 'superadmin') // Admins y superadmins pueden ver usuarios por rol
  @RequiredPermissions('user_permission') // Requiere permiso de gestión de usuarios
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener usuarios por ID de rol (Solo Admin/Superadmin con permiso de usuario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID único del rol', type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios con el rol especificado.',
    type: [UserDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron usuarios para el rol o el rol no existe.',
  })
  async findUsersByRoleId(@Param('id') id: string): Promise<UserDto[]> {
    const users = await this.rolesService.findUsersByRoleId(id);
    if (!users || users.length === 0) {
      throw new NotFoundException(`No users found for role with ID "${id}".`);
    }
    return users;
  }

  @Patch(':id') // Cambiado de Put a Patch
  @Roles('superadmin') // Solo superadmin puede actualizar roles
  @RequiredPermissions('user_permission') // Requiere permiso de gestión de usuarios
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Actualizar un rol por ID (Solo Superadmin con permiso de usuario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del rol a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente.',
    type: RoleDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  @ApiResponse({ status: 409, description: 'El nombre del rol ya existe.' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleDto> {
    const updatedRole = await this.rolesService.update(id, updateRoleDto);
    if (!updatedRole) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return updatedRole;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('superadmin') // Solo superadmin puede eliminar roles
  @RequiredPermissions('user_permission') // Requiere permiso de gestión de usuarios
  @ApiOperation({
    summary: 'Eliminar un rol por ID (Solo Superadmin con permiso de usuario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del rol a eliminar',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Rol eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.rolesService.remove(id);
  }
}
