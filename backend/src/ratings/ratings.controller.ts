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
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { RatingDto } from './dto/rating.dto';
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
// PermissionsGuard y RequiredPermissions se eliminan de PATCH/DELETE de rating,
// pero se mantienen importados si se usan en otras partes de tu app.
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva calificación',
    description:
      'Permite a cualquier usuario autenticado añadir una calificación a un título o capítulo. Un usuario solo puede calificar un elemento una vez.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Calificación creada exitosamente.',
    type: RatingDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o ya calificado.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya ha calificado este título/capítulo.',
  })
  @ApiResponse({ status: 404, description: 'Título o capítulo no encontrado.' })
  async create(
    @Request() req,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<RatingDto> {
    const userId = (req.user as User).auth0_id;
    return this.ratingsService.create(userId, createRatingDto);
  }

  @Get('by-title/:titleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las calificaciones de un título específico',
    description:
      'Lista todas las calificaciones asociadas a un ID de título dado. **Acceso público**.',
  })
  @ApiParam({
    name: 'titleId',
    description: 'ID único del título',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de calificaciones.',
    type: [RatingDto],
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async findAllByTitle(
    @Param('titleId') titleId: string,
  ): Promise<RatingDto[]> {
    return this.ratingsService.findAllByTitle(titleId);
  }

  // ************ NUEVA RUTA: Promedio de calificación por título ************
  @Get('average/title/:titleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener la calificación promedio de un título',
    description:
      'Calcula y retorna la calificación promedio de un título. Retorna 3 si no hay calificaciones.',
  })
  @ApiParam({
    name: 'titleId',
    description: 'ID único del título',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación promedio del título.',
    schema: {
      type: 'object',
      properties: { average: { type: 'number', example: 4.5 } },
    },
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async getAverageTitleRating(
    @Param('titleId') titleId: string,
  ): Promise<{ average: number }> {
    const average = await this.ratingsService.getAverageRatingForTitle(titleId);
    return { average };
  }
  // ************ FIN NUEVA RUTA ************

  // ************ NUEVA RUTA: Promedio de calificación por capítulo ************
  @Get('average/chapter/:chapterId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener la calificación promedio de un capítulo',
    description:
      'Calcula y retorna la calificación promedio de un capítulo. Retorna 3 si no hay calificaciones.',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'ID único del capítulo',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación promedio del capítulo.',
    schema: {
      type: 'object',
      properties: { average: { type: 'number', example: 4.5 } },
    },
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async getAverageChapterRating(
    @Param('chapterId') chapterId: string,
  ): Promise<{ average: number }> {
    const average =
      await this.ratingsService.getAverageRatingForChapter(chapterId);
    return { average };
  }
  // ************ FIN NUEVA RUTA ************

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener una calificación por su ID',
    description:
      'Recupera los detalles de una calificación específica. **Acceso público**.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la calificación',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación encontrada.',
    type: RatingDto,
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada.' })
  async findOne(@Param('id') id: string): Promise<RatingDto> {
    return this.ratingsService.findOne(id);
  }

  @Patch(':id')
  // ************ CAMBIO CLAVE: Eliminar PermissionsGuard y RequiredPermissions ************
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Todos los roles autenticados pueden intentar modificar
  // @RequiredPermissions('moderation_permission') // <<-- ELIMINADO
  // ************ FIN CAMBIO CLAVE ************
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una calificación por su ID',
    description:
      'Permite al propietario de la calificación actualizarla. Un **Admin/Superadmin** (con permiso de moderación) puede actualizar cualquier calificación, excepto las de un Superadmin si el editor es Admin.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único de la calificación a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Calificación actualizada exitosamente.',
    type: RatingDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario, o rol/permiso insuficiente, o intento de modificar calificación de Superadmin).',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<RatingDto> {
    const currentUser = req.user as User;
    // La lógica de permisos (incluyendo moderación y jerarquía) se delega al servicio
    return this.ratingsService.update(id, currentUser, updateRatingDto);
  }

  @Delete(':id')
  // ************ CAMBIO CLAVE: Eliminar PermissionsGuard y RequiredPermissions ************
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Todos los roles autenticados pueden intentar eliminar
  // @RequiredPermissions('moderation_permission') // <<-- ELIMINADO
  // ************ FIN CAMBIO CLAVE ************
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una calificación por su ID',
    description:
      'Permite al propietario de la calificación eliminarla. Un **Admin/Superadmin** (con permiso de moderación) puede eliminar cualquier calificación, excepto las de un Superadmin si el eliminador es Admin.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único de la calificación a eliminar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Calificación eliminada exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario, o rol/permiso insuficiente, o intento de eliminar calificación de Superadmin).',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const currentUser = req.user as User;
    // La lógica de permisos (incluyendo moderación y jerarquía) se delega al servicio
    await this.ratingsService.remove(id, currentUser);
  }
}
