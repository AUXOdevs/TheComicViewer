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
import { RatingDto } from './dto/rating.dto'; // Asegúrate de que este DTO existe y es completo
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

@ApiTags('ratings') // Agrupa este controlador bajo la etiqueta 'ratings' en Swagger
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación y rol
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede calificar
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created
  @ApiOperation({
    summary: 'Crear una nueva calificación',
    description:
      'Permite a cualquier usuario autenticado añadir una calificación a un título o capítulo.',
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
  }) // Cambiado a 409
  @ApiResponse({ status: 404, description: 'Título o capítulo no encontrado.' })
  async create(
    @Request() req,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<RatingDto> {
    const userId = (req.user as User).auth0_id;
    return this.ratingsService.create(userId, createRatingDto);
  }

  @Get('by-title/:titleId')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
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

  @Get(':id')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
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
  // Se añade PermissionsGuard y RequiredPermissions para admins/superadmins que moderen
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder
  @RequiredPermissions('moderation_permission') // Este permiso es para admins que editan ratings de otros
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Actualizar una calificación por su ID',
    description:
      'Permite al propietario de la calificación o a un **Admin/Superadmin** (con permiso de moderación) actualizar una calificación existente.',
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
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<RatingDto> {
    const user = req.user as User;
    // Si el usuario es 'admin' o 'superadmin' y tiene el permiso 'moderation_permission'
    const hasModerationPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.moderation_permission;
    return this.ratingsService.update(
      id,
      user.auth0_id,
      updateRatingDto,
      hasModerationPermission, // Se pasa el permiso al servicio
    );
  }

  @Delete(':id')
  // Se añade PermissionsGuard y RequiredPermissions para admins/superadmins que moderen
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder
  @RequiredPermissions('moderation_permission') // Este permiso es para admins que borran ratings de otros
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content
  @ApiOperation({
    summary: 'Eliminar una calificación por su ID',
    description:
      'Permite al propietario de la calificación o a un **Admin/Superadmin** (con permiso de moderación) eliminar una calificación existente.',
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
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as User;
    const hasModerationPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.moderation_permission;
    await this.ratingsService.remove(
      id,
      user.auth0_id,
      hasModerationPermission,
    );
  }
}
