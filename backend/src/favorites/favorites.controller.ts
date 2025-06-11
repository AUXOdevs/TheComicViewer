import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteDto } from './dto/favorite.dto';
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

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard) // Todas las rutas requieren autenticación y rol
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden añadir favoritos
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Añadir un título o capítulo a favoritos (Suscrito o Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Favorito añadido exitosamente.',
    type: FavoriteDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o intento de añadir dos veces.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: Suscrito o Admin).',
  })
  @ApiResponse({ status: 404, description: 'Título o capítulo no encontrado.' })
  async create(
    @Request() req,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteDto> {
    const userId = (req.user as User).auth0_id;
    return this.favoritesService.create(userId, createFavoriteDto);
  }

  @Get()
  @Roles('Registrado', 'Suscrito', 'admin') // Cualquier usuario autenticado puede ver sus favoritos
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los favoritos del usuario autenticado',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos del usuario.',
    type: [FavoriteDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  async findAllByUser(@Request() req): Promise<FavoriteDto[]> {
    const userId = (req.user as User).auth0_id;
    return this.favoritesService.findAllByUser(userId);
  }

  @Get(':id')
  @Roles('Registrado', 'Suscrito', 'admin') // Cualquier usuario autenticado puede ver UN favorito propio
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un favorito por ID (solo el usuario propietario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Favorito encontrado.',
    type: FavoriteDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario del favorito).',
  })
  @ApiResponse({ status: 404, description: 'Favorito no encontrado.' })
  async findOne(@Param('id') id: string, @Request() req): Promise<FavoriteDto> {
    const userId = (req.user as User).auth0_id;
    return this.favoritesService.findOne(id, userId);
  }

  @Delete(':id')
  @Roles('Suscrito', 'admin') // Solo suscritos y admins pueden eliminar favoritos
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Eliminar un favorito por ID (Suscrito o Admin, solo el propietario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 204, description: 'Favorito eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario o rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Favorito no encontrado.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = (req.user as User).auth0_id;
    await this.favoritesService.remove(id, userId);
  }
}
