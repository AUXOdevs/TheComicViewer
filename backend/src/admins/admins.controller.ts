import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admins.service'; // Asegúrate de que el nombre del servicio sea AdminService, no AdminService
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminDto } from './dto/admin.dto'; // Asegúrate de que este DTO existe y es completo
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('admins') // Agrupa este controlador bajo la etiqueta 'admins' en Swagger
@Controller('admins')
// Aplica los guards de JWT y Roles a nivel de controlador para todas las rutas.
// PermissionsGuard se aplicará solo si la ruta tiene @RequiredPermissions.
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AdminsController {
  // Asegúrate de que el nombre de la clase sea AdminsController, no AdminController
  constructor(private readonly adminsService: AdminService) {} // Asegúrate de que el nombre del servicio sea AdminService

  @Post()
  @Roles('superadmin') // Solo usuarios con rol 'superadmin' pueden acceder
  @RequiredPermissions('user_permission') // Y deben tener el permiso 'user_permission' activo en su perfil de admin
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created si es exitoso
  @ApiOperation({
    summary: 'Crear una nueva entrada de administrador',
    description:
      'Asigna el rol de "admin" a un usuario existente y define sus permisos administrativos. Solo accesible por un **Superadmin** con permiso de gestión de usuarios.',
  })
  @ApiBearerAuth('JWT-auth') // Indica que esta ruta requiere un token JWT para autenticación
  @ApiResponse({
    status: 201,
    description: 'Administrador creado exitosamente.',
    type: AdminDto, // Define el tipo de respuesta esperada en caso de éxito
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({
    status: 401,
    description: 'No autenticado (token inválido o ausente).',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Usuario a asignar no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya es un administrador.',
  })
  async create(@Body() createAdminDto: CreateAdminDto): Promise<AdminDto> {
    return this.adminsService.create(createAdminDto);
  }

  @Get()
  @Roles('admin', 'superadmin') // Usuarios con rol 'admin' o 'superadmin' pueden acceder
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener la lista de todos los administradores',
    description:
      'Lista todos los usuarios que tienen una entrada en la tabla de administradores. Accesible por **Admin** y **Superadmin**.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de administradores.',
    type: [AdminDto], // Define el tipo de respuesta esperada (un array de AdminDto)
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  async findAll(): Promise<AdminDto[]> {
    return this.adminsService.findAll();
  }

  @Get(':admin_id')
  @Roles('admin', 'superadmin') // Usuarios con rol 'admin' o 'superadmin' pueden acceder
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener un administrador por su ID',
    description:
      'Recupera los detalles de un administrador específico. Accesible por **Admin** y **Superadmin**.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'admin_id',
    description: 'ID único del administrador',
    type: String,
  }) // Documenta el parámetro de la URL
  @ApiResponse({
    status: 200,
    description: 'Administrador encontrado.',
    type: AdminDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado.' })
  async findOne(@Param('admin_id') admin_id: string): Promise<AdminDto> {
    return this.adminsService.findOne(admin_id);
  }

  @Patch(':admin_id')
  @Roles('superadmin') // Solo usuarios con rol 'superadmin' pueden acceder
  @RequiredPermissions('user_permission') // Y deben tener el permiso 'user_permission'
  @HttpCode(HttpStatus.OK) // Retorna 200 OK si es exitoso
  @ApiOperation({
    summary: 'Actualizar los permisos de un administrador',
    description:
      'Modifica los permisos de un administrador existente (contenido, usuarios, moderación). Solo accesible por un **Superadmin** con permiso de gestión de usuarios.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'admin_id',
    description: 'ID único del administrador a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Administrador actualizado exitosamente.',
    type: AdminDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos (ej. intentar cambiar el user_id).',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado.' })
  async update(
    @Param('admin_id') admin_id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<AdminDto> {
    return this.adminsService.update(admin_id, updateAdminDto);
  }

  @Delete(':admin_id')
  @Roles('superadmin') // Solo usuarios con rol 'superadmin' pueden acceder
  @RequiredPermissions('user_permission') // Y deben tener el permiso 'user_permission'
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content si es exitoso (no hay cuerpo de respuesta)
  @ApiOperation({
    summary:
      'Eliminar una entrada de administrador y resetear el rol del usuario',
    description:
      'Elimina la entrada de un administrador de la tabla de "admins" y automáticamente revierte el rol del usuario asociado a "Registrado". Solo accesible por un **Superadmin** con permiso de gestión de usuarios.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'admin_id',
    description: 'ID único del administrador a eliminar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Administrador eliminado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado.' })
  async remove(@Param('admin_id') admin_id: string): Promise<void> {
    await this.adminsService.remove(admin_id);
  }
}
