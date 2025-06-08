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
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { RatingDto } from './dto/rating.dto';
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

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden calificar
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva calificación (Suscrito o Admin)' })
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
    description: 'No autorizado (rol requerido: Suscrito o Admin).',
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
    summary:
      'Obtener todas las calificaciones de un título por ID (Acceso público)',
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una calificación por ID (Acceso público)' })
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden actualizar
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una calificación por ID (propietario o Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Calificación actualizada exitosamente.',
    type: RatingDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario o rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<RatingDto> {
    const user = req.user as User;
    const isAdmin = user.role?.name === 'admin';
    return this.ratingsService.update(
      id,
      user.auth0_id,
      updateRatingDto,
      isAdmin,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden eliminar
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una calificación por ID (propietario o Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 204,
    description: 'Calificación eliminada exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario o rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Calificación no encontrada.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as User;
    const isAdmin = user.role?.name === 'admin';
    await this.ratingsService.remove(id, user.auth0_id, isAdmin);
  }
}
