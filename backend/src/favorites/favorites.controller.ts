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
  ForbiddenException, // Para errores de ForbiddenException
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteDto } from './dto/favorite.dto'; // Asegúrate de que este DTO existe y es completo
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

@ApiTags('favorites') // Agrupa este controlador bajo la etiqueta 'favorites' en Swagger
@Controller('favorites')
// Todas las rutas requieren autenticación. RolesGuard y PermissionsGuard aplicados por método si es necesario.
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @UseGuards(RolesGuard) // RolesGuard se aplica aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede añadir favoritos
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created
  @ApiOperation({
    summary: 'Añadir un título o capítulo a favoritos',
    description:
      'Permite a cualquier usuario autenticado añadir un elemento a su lista de favoritos.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Favorito añadido exitosamente.',
    type: FavoriteDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos o el elemento ya está en favoritos.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
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
  @UseGuards(RolesGuard) // RolesGuard se aplica aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede ver sus favoritos
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener todos los favoritos del usuario autenticado',
    description:
      'Lista todos los elementos marcados como favoritos por el usuario actual. Accesible por cualquier usuario autenticado.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos del usuario.',
    type: [FavoriteDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol insuficiente).',
  })
  async findAllByUser(@Request() req): Promise<FavoriteDto[]> {
    const userId = (req.user as User).auth0_id;
    return this.favoritesService.findAllByUser(userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard, PermissionsGuard) // RolesGuard y PermissionsGuard se aplican aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder, con lógica de permiso para Admin/Superadmin
  @RequiredPermissions('user_permission') // Admins necesitan este permiso para ver favoritos ajenos
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener un favorito por ID',
    description:
      'Recupera los detalles de un favorito específico. Solo el **propietario** o un **Admin/Superadmin** con permiso de gestión de usuarios puede acceder.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'ID único del favorito', type: String })
  @ApiResponse({
    status: 200,
    description: 'Favorito encontrado.',
    type: FavoriteDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Favorito no encontrado.' })
  async findOne(@Param('id') id: string, @Request() req): Promise<FavoriteDto> {
    const user = req.user as User;
    // Determinar si el usuario tiene permiso de gestión de usuarios
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;

    // Se pasa el hasUserPermission al servicio
    return this.favoritesService.findOne(id, user.auth0_id, hasUserPermission);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard) // RolesGuard y PermissionsGuard se aplican aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede acceder, con lógica de permiso para Admin/Superadmin
  @RequiredPermissions('user_permission') // Admins necesitan este permiso para eliminar favoritos ajenos
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content
  @ApiOperation({
    summary: 'Eliminar un favorito por ID',
    description:
      'Elimina un elemento de la lista de favoritos. Solo el **propietario** o un **Admin/Superadmin** (con permiso de gestión de usuarios) puede eliminar.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del favorito a eliminar',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Favorito eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Favorito no encontrado.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;
    await this.favoritesService.remove(id, user.auth0_id, hasUserPermission);
  }
}
