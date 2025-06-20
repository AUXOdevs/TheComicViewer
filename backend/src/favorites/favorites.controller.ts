import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { FavoriteDto } from './dto/favorite.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express'; // Para obtener el user del request (ajustar tipos si es necesario)
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';
import { User } from 'src/user/entities/user.entity'; // Importar la entidad User para tipado

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard) // Todas las rutas aquí requieren autenticación JWT por defecto
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede añadir favoritos
  @UseGuards(RolesGuard) // Aplica RolesGuard
  @ApiOperation({ summary: 'Añadir un título o capítulo a favoritos' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Favorito creado exitosamente.',
    type: FavoriteDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'Conflicto (favorito ya existe).' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Título o capítulo no encontrado.' })
  async create(
    @Req() req: Request,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteDto> {
    const userId = (req.user as User).auth0_id; // Usa auth0_id
    return this.favoritesService.create(userId, createFavoriteDto);
  }

  @Get('my-favorites')
  @HttpCode(HttpStatus.OK)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede ver sus propios favoritos
  @UseGuards(RolesGuard) // Aplica RolesGuard
  @ApiOperation({
    summary: 'Obtener todos los favoritos del usuario autenticado',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos del usuario.',
    type: [FavoriteDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron favoritos para el usuario.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  async findAllMyFavorites(@Req() req: Request): Promise<FavoriteDto[]> {
    const userId = (req.user as User).auth0_id; // Usa auth0_id
    return this.favoritesService.findAllByUser(userId);
  }

  // --- NUEVA RUTA: BUSCAR FAVORITOS DE OTRO USUARIO POR ID O EMAIL ---
  @Get('search-by-user')
  @HttpCode(HttpStatus.OK)
  // Seguridad: Solo Admin/Superadmin con permiso de usuario puede buscar favoritos de otros
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission')
  @UseGuards(RolesGuard, PermissionsGuard) // Aplica RolesGuard y PermissionsGuard
  @ApiOperation({ summary: 'Buscar favoritos de un usuario por ID o email' })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Auth0 ID del usuario o email para buscar sus favoritos.',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos del usuario especificado.',
    type: [FavoriteDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o favoritos no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  async findFavoritesOfUser(
    @Query('query') query: string,
  ): Promise<FavoriteDto[]> {
    return this.favoritesService.findAllFavoritesOfUserByQuery(query);
  }
  // --- FIN NUEVA RUTA ---

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder
  @UseGuards(RolesGuard, PermissionsGuard) // Aplica RolesGuard y PermissionsGuard
  @ApiOperation({ summary: 'Obtener un favorito por ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID único del favorito', type: String })
  @ApiResponse({
    status: 200,
    description: 'Favorito encontrado por ID.',
    type: FavoriteDto,
  })
  @ApiResponse({ status: 404, description: 'Favorito no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<FavoriteDto> {
    const user = req.user as User;
    // req.user.admin será eager-loaded debido a la entidad User.
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;
    return this.favoritesService.findOne(id, user.auth0_id, hasUserPermission);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder
  @UseGuards(RolesGuard, PermissionsGuard) // Aplica RolesGuard y PermissionsGuard
  @ApiOperation({ summary: 'Eliminar un favorito por ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del favorito a eliminar',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Favorito eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Favorito no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;
    await this.favoritesService.remove(id, user.auth0_id, hasUserPermission);
  }
}
