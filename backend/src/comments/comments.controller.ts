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
  UseGuards,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/user/entities/user.entity';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden comentar
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo comentario (Suscrito o Admin)' })
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
    description: 'No autorizado (rol requerido: Suscrito o Admin).',
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
    summary:
      'Obtener todos los comentarios de un título por ID (Acceso público)',
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
    summary:
      'Obtener todos los comentarios de un capítulo por ID (Acceso público)',
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
  @ApiOperation({ summary: 'Obtener un comentario por ID (Acceso público)' })
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
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden actualizar
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un comentario por ID (propietario o Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Comentario actualizado exitosamente.',
    type: CommentDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario o rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const user = req.user as User;
    const isAdmin = user.role?.name === 'admin';
    return this.commentsService.update(
      id,
      user.auth0_id,
      updateCommentDto,
      isAdmin,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden eliminar
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un comentario por ID (propietario o Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 204,
    description: 'Comentario eliminado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario o rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as User;
    const isAdmin = user.role?.name === 'admin';
    await this.commentsService.remove(id, user.auth0_id, isAdmin);
  }
}
