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
  Request,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ChapterDto } from './dto/chapter.dto'; // Asegúrate de que este DTO existe y es completo
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
import { User } from 'src/user/entities/user.entity'; // Importar User para tipado

@ApiTags('chapters') // Agrupa este controlador bajo la etiqueta 'chapters' en Swagger
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Requiere autenticación, rol y permisos
  @Roles('admin', 'superadmin') // Solo usuarios con rol 'admin' o 'superadmin' pueden crear
  @RequiredPermissions('content_permission') // Y deben tener el permiso 'content_permission'
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created
  @ApiOperation({
    summary: 'Crear un nuevo capítulo',
    description:
      'Permite añadir un nuevo capítulo a un título existente. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Capítulo creado exitosamente.',
    type: ChapterDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Título asociado no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un capítulo con el mismo número para este título.',
  })
  async create(
    @Body() createChapterDto: CreateChapterDto,
  ): Promise<ChapterDto> {
    return this.chaptersService.create(createChapterDto);
  }

  @Get('by-title/:titleId')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener todos los capítulos de un título específico',
    description:
      'Lista todos los capítulos asociados a un ID de título dado. **Acceso público**.',
  })
  @ApiParam({
    name: 'titleId',
    description: 'ID único del título',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de capítulos.',
    type: [ChapterDto],
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async findAllByTitle(
    @Param('titleId') titleId: string,
  ): Promise<ChapterDto[]> {
    return this.chaptersService.findAllByTitle(titleId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener un capítulo por su ID',
    description:
      'Recupera los detalles de un capítulo específico. **Acceso público**, pero el contenido puede ser limitado para usuarios no suscritos.',
  })
  @ApiParam({ name: 'id', description: 'ID único del capítulo', type: String })
  @ApiResponse({
    status: 200,
    description: 'Capítulo encontrado.',
    type: ChapterDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Acceso limitado (para no suscritos si el contenido es premium).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async findOne(@Param('id') id: string, @Request() req): Promise<ChapterDto> {
    // Si la petición incluye un token, `req.user` estará disponible, permitiendo al servicio
    // determinar si el usuario es Suscrito o Admin para dar acceso completo al capítulo.
    const user = req['user'] as User; // req.user puede ser undefined si no hay token
    const isAuthenticated = !!user;
    const userRole = user?.role?.name; // 'Registrado', 'Suscrito', 'admin', 'superadmin' o undefined
    // El servicio deberá usar isAuthenticated y userRole para decidir qué devolver (ej. contenido completo o parcial)
    return this.chaptersService.findOne(id, isAuthenticated, userRole);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Requiere autenticación, rol y permisos
  @Roles('admin', 'superadmin') // Solo usuarios con rol 'admin' o 'superadmin' pueden actualizar
  @RequiredPermissions('content_permission') // Y deben tener el permiso 'content_permission'
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Actualizar un capítulo por su ID',
    description:
      'Modifica los detalles de un capítulo existente. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del capítulo a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Capítulo actualizado exitosamente.',
    type: ChapterDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ): Promise<ChapterDto> {
    return this.chaptersService.update(id, updateChapterDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Requiere autenticación, rol y permisos
  @Roles('admin', 'superadmin') // Solo usuarios con rol 'admin' o 'superadmin' pueden eliminar
  @RequiredPermissions('content_permission') // Y deben tener el permiso 'content_permission'
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content
  @ApiOperation({
    summary: 'Eliminar un capítulo por su ID',
    description:
      'Elimina un capítulo existente. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del capítulo a eliminar',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Capítulo eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.chaptersService.remove(id);
  }
}
