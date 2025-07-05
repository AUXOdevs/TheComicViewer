// src/comments/comments.controller.ts
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
  Query, // Importar Query
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
  ApiQuery, // Importar ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/user/entities/user.entity';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';
import { GetAllCommentsDto, OrderDirection } from './dto/get-all-comments.dto'; // Importar el nuevo DTO y enum

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

  // --- NUEVA RUTA: Obtener comentarios con paginación y filtros ---
  @Get('filtered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener comentarios con paginación, filtros y ordenación',
    description:
      'Lista todos los comentarios disponibles, con opciones de paginación, filtrado por usuario, nombre de usuario, nombre de título, nombre de capítulo, tipo de comentario (título/capítulo) y contenido del comentario. **Acceso público**.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Número de página para la paginación (por defecto: 1).',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description:
      'Cantidad de elementos por página (por defecto: 10, máximo: 100).',
  })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false,
    description:
      'Columna por la que ordenar (ej. `comment_date`, `user.username`, `title.name`, `chapter.chapter_number`). Por defecto: `comment_date`.',
  })
  @ApiQuery({
    name: 'order',
    enum: ['ASC', 'DESC'],
    required: false,
    description:
      'Dirección de la ordenación (ASC o DESC). Por defecto: `DESC`.',
  })
  @ApiQuery({
    name: 'userId',
    type: String,
    required: false,
    description: 'Filtrar comentarios por el ID del usuario que los creó.',
  })
  @ApiQuery({
    name: 'username',
    type: String,
    required: false,
    description:
      'Filtrar comentarios por el nombre de usuario (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiQuery({
    name: 'titleName',
    type: String,
    required: false,
    description:
      'Filtrar comentarios por el nombre del título al que pertenecen (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiQuery({
    name: 'chapterName',
    type: String,
    required: false,
    description:
      'Filtrar comentarios por el nombre del capítulo al que pertenecen (búsqueda parcial, insensible a mayúsculas/minúsculas). Solo aplica a comentarios de capítulos.',
  })
  @ApiQuery({
    name: 'isTitleComment',
    type: Boolean,
    required: false,
    description:
      'Filtrar solo comentarios de títulos (true) o solo comentarios de capítulos (false). Si no se especifica, incluye ambos.',
  })
  @ApiQuery({
    name: 'commentText',
    type: String,
    required: false,
    description:
      'Filtrar comentarios por texto (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comentarios con paginación y filtros.',
    schema: {
      type: 'object',
      properties: {
        comments: {
          type: 'array',
          items: { $ref: '#/components/schemas/CommentDto' },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAllFiltered(
    @Query() queryParams: GetAllCommentsDto,
  ): Promise<{
    comments: CommentDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.commentsService.findAllPaginatedAndFiltered(queryParams);
  }
  // --- FIN NUEVA RUTA ---

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
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
    const currentUser = req.user as User;
    return this.commentsService.update(id, currentUser, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
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
    const currentUser = req.user as User;
    await this.commentsService.remove(id, currentUser);
  }
}
