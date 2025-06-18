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
import { CommentDto } from './dto/comment.dto'; // Asegúrate de que este DTO existe y es completo
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
import { User } from 'src/user/entities/user.entity'; // Importar User para tipado
import { PermissionsGuard } from 'src/auth/guards/permissions.guard'; // Importar
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator'; // Importar

@ApiTags('comments') // Agrupa este controlador bajo la etiqueta 'comments' en Swagger
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación y rol
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede comentar
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created
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
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
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
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
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
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
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
  // Se añaden PermissionsGuard y RequiredPermissions para admins/superadmins que moderen
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder (RolesGuard)
  @RequiredPermissions('moderation_permission') // Solo si es admin/superadmin, debe tener este permiso
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Actualizar un comentario por su ID',
    description:
      'Permite al propietario del comentario o a un **Admin/Superadmin** (con permiso de moderación) actualizar un comentario existente.',
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
      'No autorizado (no es el propietario O rol/permiso insuficiente para moderar).',
  })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const user = req.user as User;
    // La lógica de si es admin y tiene permiso de moderación se pasa al servicio
    const hasModerationPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.moderation_permission;
    return this.commentsService.update(
      id,
      user.auth0_id,
      updateCommentDto,
      hasModerationPermission,
    );
  }

  @Delete(':id')
  // Se añaden PermissionsGuard y RequiredPermissions para admins/superadmins que moderen
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder (RolesGuard)
  @RequiredPermissions('moderation_permission') // Solo si es admin/superadmin, debe tener este permiso
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content
  @ApiOperation({
    summary: 'Eliminar un comentario por su ID',
    description:
      'Permite al propietario del comentario o a un **Admin/Superadmin** (con permiso de moderación) eliminar un comentario existente.',
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
      'No autorizado (no es el propietario O rol/permiso insuficiente para moderar).',
  })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as User;
    const hasModerationPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.moderation_permission;
    await this.commentsService.remove(
      id,
      user.auth0_id,
      hasModerationPermission,
    );
  }
}
