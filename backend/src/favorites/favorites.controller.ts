// src/favorites/favorites.controller.ts
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
import { Request } from 'express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';
import { User } from 'src/user/entities/user.entity';
import {
  GetAllFavoritesDto,
  OrderDirection,
} from './dto/get-all-favorites.dto'; // Importar el nuevo DTO y enum

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard) // Todas las rutas aquí requieren autenticación JWT por defecto
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @UseGuards(RolesGuard)
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
    const userId = (req.user as User).auth0_id;
    return this.favoritesService.create(userId, createFavoriteDto);
  }

  @Get('my-favorites')
  @HttpCode(HttpStatus.OK)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Obtener todos los favoritos del usuario autenticado (sin filtros avanzados)',
    description:
      'Obtiene todos los favoritos del usuario autenticado sin opciones de paginación o filtrado avanzado. Para filtros, use `/my-favorites-filtered`.',
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
    const userId = (req.user as User).auth0_id;
    return this.favoritesService.findAllByUser(userId);
  }

  // --- NUEVA RUTA: Obtener favoritos del usuario con paginación y filtros ---
  @Get('my-favorites-filtered')
  @HttpCode(HttpStatus.OK)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Obtener favoritos del usuario autenticado con paginación, filtros y ordenación',
    description:
      'Lista los favoritos del usuario autenticado, con opciones de paginación, filtrado por nombre de título, nombre de capítulo y tipo de favorito (título/capítulo), y ordenación.',
  })
  @ApiBearerAuth('JWT-auth')
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
      'Columna por la que ordenar (ej. `date_added`, `title.name`, `chapter.chapter_number`). Por defecto: `date_added`.',
  })
  @ApiQuery({
    name: 'order',
    enum: ['ASC', 'DESC'],
    required: false,
    description:
      'Dirección de la ordenación (ASC o DESC). Por defecto: `DESC`.',
  })
  @ApiQuery({
    name: 'titleName',
    type: String,
    required: false,
    description:
      'Filtrar favoritos por el nombre del título (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiQuery({
    name: 'chapterName',
    type: String,
    required: false,
    description:
      'Filtrar favoritos por el nombre del capítulo (búsqueda parcial, insensible a mayúsculas/minúsculas). Solo aplica a favoritos de capítulos.',
  })
  @ApiQuery({
    name: 'isTitleFavorite',
    type: Boolean,
    required: false,
    description:
      'Filtrar solo favoritos de títulos (true) o solo favoritos de capítulos (false). Si no se especifica, incluye ambos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos del usuario con paginación y filtros.',
    schema: {
      type: 'object',
      properties: {
        favorites: {
          type: 'array',
          items: { $ref: '#/components/schemas/FavoriteDto' },
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
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAllMyFavoritesFiltered(
    @Req() req: Request,
    @Query() queryParams: GetAllFavoritesDto,
  ): Promise<{
    favorites: FavoriteDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userId = (req.user as User).auth0_id;
    return this.favoritesService.findAllPaginatedAndFiltered(
      userId,
      queryParams,
    );
  }
  // --- FIN NUEVA RUTA ---

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Verificar si un título o capítulo está en favoritos del usuario autenticado',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'title_id',
    required: false,
    description:
      'ID del título a verificar. Requerido si chapter_id no está presente.',
    type: String,
  })
  @ApiQuery({
    name: 'chapter_id',
    required: false,
    description:
      'ID del capítulo a verificar. Requerido si title_id no está presente.',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del favorito. Retorna { isFavorited: true/false }.',
    schema: {
      type: 'object',
      properties: {
        isFavorited: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Parámetros inválidos (ni title_id ni chapter_id proporcionados).',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  async checkFavoriteStatus(
    @Req() req: Request,
    @Query('title_id') title_id?: string,
    @Query('chapter_id') chapter_id?: string,
  ): Promise<{ isFavorited: boolean }> {
    const userId = (req.user as User).auth0_id;
    const isFavorited = await this.favoritesService.checkFavoriteStatus(
      userId,
      title_id,
      chapter_id,
    );
    return { isFavorited };
  }

  @Get('search-by-user')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('user_permission')
  @UseGuards(RolesGuard, PermissionsGuard)
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

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @UseGuards(RolesGuard, PermissionsGuard)
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
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;
    return this.favoritesService.findOne(id, user.auth0_id, hasUserPermission);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @UseGuards(RolesGuard, PermissionsGuard)
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
