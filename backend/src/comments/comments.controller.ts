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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentDto } from './dto/comment.dto';
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
import { User } from 'src/user/entities/user.entity';
// Importamos PermissionsGuard y RequiredPermissions para otras rutas si es necesario,
// pero los eliminamos de PATCH/DELETE de comentarios.
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo comentario',
    description:
      'Permite a cualquier usuario autenticado añadir un comentario a un título o capítulo.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Comentario creado exitosamente.',
    type: CommentDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente para comentar).',
  })
  @ApiResponse({ status: 404, description: 'Título o capítulo no encontrado.' })
  async create(
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    const userId = (req.user as User).auth0_id;
    return this.commentsService.create(userId, createCommentDto);
  }

  @Get('by-title/:titleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los comentarios de un título específico',
    description:
      'Lista todos los comentarios asociados a un ID de título dado. **Acceso público**.',
  })
  @ApiParam({
    name: 'titleId',
    description: 'ID único del título',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comentarios.',
    type: [CommentDto],
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async findAllByTitle(
    @Param('titleId') titleId: string,
  ): Promise<CommentDto[]> {
    return this.commentsService.findAllByTitle(titleId);
  }

  @Get('by-chapter/:chapterId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los comentarios de un capítulo específico',
    description:
      'Lista todos los comentarios asociados a un ID de capítulo dado. **Acceso público**.',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'ID único del capítulo',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comentarios.',
    type: [CommentDto],
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async findAllByChapter(
    @Param('chapterId') chapterId: string,
  ): Promise<CommentDto[]> {
    return this.commentsService.findAllByChapter(chapterId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un comentario por su ID',
    description:
      'Recupera los detalles de un comentario específico. **Acceso público**.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del comentario',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Comentario encontrado.',
    type: CommentDto,
  })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado.' })
  async findOne(@Param('id') id: string): Promise<CommentDto> {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  // ************ CAMBIO CLAVE AQUÍ ************
  // Eliminamos PermissionsGuard y RequiredPermissions, la lógica fina se maneja en el servicio.
  @UseGuards(JwtAuthGuard, RolesGuard) // Solo JwtAuthGuard y RolesGuard (todos pueden llegar al controlador)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Todos los roles autenticados pueden intentar modificar
  // @RequiredPermissions('moderation_permission') // <<-- ELIMINADO
  // ************ FIN CAMBIO CLAVE ************
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un comentario por su ID',
    description:
      'Permite al propietario del comentario actualizarlo. Un **Admin/Superadmin** (con permiso de moderación) puede actualizar cualquier comentario, excepto los de un Superadmin si el editor es Admin.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del comentario a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Comentario actualizado exitosamente.',
    type: CommentDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario, o rol/permiso insuficiente, o intento de modificar comentario de Superadmin).',
  })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const currentUser = req.user as User; // Pasar el objeto User completo
    return this.commentsService.update(id, currentUser, updateCommentDto);
  }

  @Delete(':id')
  // ************ CAMBIO CLAVE AQUÍ ************
  // Eliminamos PermissionsGuard y RequiredPermissions, la lógica fina se maneja en el servicio.
  @UseGuards(JwtAuthGuard, RolesGuard) // Solo JwtAuthGuard y RolesGuard (todos pueden llegar al controlador)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Todos los roles autenticados pueden intentar eliminar
  // @RequiredPermissions('moderation_permission') // <<-- ELIMINADO
  // ************ FIN CAMBIO CLAVE ************
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un comentario por su ID',
    description:
      'Permite al propietario del comentario eliminarlo. Un **Admin/Superadmin** (con permiso de moderación) puede eliminar cualquier comentario, excepto los de un Superadmin si el eliminador es Admin.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del comentario a eliminar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Comentario eliminado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario, o rol/permiso insuficiente, o intento de eliminar comentario de Superadmin).',
  })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const currentUser = req.user as User; // Pasar el objeto User completo
    await this.commentsService.remove(id, currentUser);
  }
}
