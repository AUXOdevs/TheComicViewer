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
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ReadingHistoryService } from './reading-history.service';
import { CreateReadingHistoryDto } from './dto/create-reading-history.dto';
import { UpdateReadingHistoryDto } from './dto/update-reading-history.dto';
import { ReadingHistoryDto } from './dto/reading-history.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/user/entities/user.entity';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('reading-history') // Agrupa este controlador bajo la etiqueta 'reading-history' en Swagger
@Controller('reading-history')
@UseGuards(JwtAuthGuard) // Todas las rutas en este controlador requieren autenticación JWT
export class ReadingHistoryController {
  constructor(private readonly readingHistoryService: ReadingHistoryService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard) // RolesGuard y PermissionsGuard se aplican aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin') // Cualquier usuario autenticado puede registrar/actualizar su historial
  @RequiredPermissions('user_permission') // Se usa para que admins puedan especificar targetUserId
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created
  @ApiOperation({
    summary: 'Registrar o actualizar el progreso de lectura de un capítulo',
    description:
      'Permite a cualquier usuario autenticado registrar el progreso de lectura de un capítulo o actualizarlo si ya existe. Los **Admins/Superadmins** con `user_permission` pueden hacerlo para **cualquier usuario** especificando `userId` en el query param.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'userId',
    required: false,
    description:
      'ID de Auth0 del usuario para quien se registra/actualiza el historial (solo para Admin/Superadmin con `user_permission`). Si no se provee, se usa el ID del usuario autenticado.',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Historial creado/actualizado exitosamente.',
    type: ReadingHistoryDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (rol o permiso insuficiente para el usuario objetivo, o intento de manipular historial ajeno sin permisos).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo o título no encontrado.' })
  async createOrUpdate(
    @Request() req,
    @Body() createReadingHistoryDto: CreateReadingHistoryDto,
    @Query('userId') targetUserIdQueryParam?: string, // Parámetro de consulta opcional para admins
  ): Promise<ReadingHistoryDto> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;

    // Determina el userId para quien se va a crear/actualizar el historial
    // Si es un admin con permiso y se provee un userId en el query, usa ese.
    // De lo contrario, usa el auth0_id del usuario autenticado.
    const actualUserIdForHistory =
      hasUserPermission && targetUserIdQueryParam
        ? targetUserIdQueryParam
        : user.auth0_id;

    if (!actualUserIdForHistory) {
      throw new ForbiddenException(
        'Se debe proporcionar un ID de usuario o debe estar logueado.',
      );
    }

    // Si un usuario normal intenta especificar un userId diferente al suyo, denegar
    if (
      !hasUserPermission &&
      targetUserIdQueryParam &&
      targetUserIdQueryParam !== user.auth0_id
    ) {
      throw new ForbiddenException(
        'No tienes permiso para modificar el historial de lectura de otro usuario.',
      );
    }

    return this.readingHistoryService.createOrUpdate(
      actualUserIdForHistory,
      createReadingHistoryDto,
    );
  }

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard) // RolesGuard y PermissionsGuard se aplican aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @RequiredPermissions('user_permission') // Se usa para que admins puedan especificar targetUserId en el query
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary:
      'Obtener el historial de lectura del usuario autenticado o de otro usuario',
    description:
      'Lista todos los registros del historial de lectura. Un usuario normal ve su propio historial. Un **Admin/Superadmin** con `user_permission` puede ver el historial de cualquier usuario especificando `userId` como Query Param.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'userId',
    required: false,
    description:
      'ID de Auth0 del usuario cuyo historial se desea ver (solo para Admin/Superadmin con `user_permission`). Si no se provee, se usa el ID del usuario autenticado.',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de historial de lectura.',
    type: [ReadingHistoryDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  async findAllByUser(
    @Request() req,
    @Query('userId') targetUserIdQueryParam?: string, // Parámetro de consulta
  ): Promise<ReadingHistoryDto[]> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;

    const actualUserId =
      hasUserPermission && targetUserIdQueryParam
        ? targetUserIdQueryParam
        : user.auth0_id;

    if (!actualUserId) {
      throw new ForbiddenException(
        'Se debe proporcionar un ID de usuario o debe estar logueado.',
      );
    }
    // Si un usuario normal intenta ver un historial diferente al suyo, denegar
    if (
      !hasUserPermission &&
      targetUserIdQueryParam &&
      targetUserIdQueryParam !== user.auth0_id
    ) {
      throw new ForbiddenException(
        'No tienes permiso para ver el historial de lectura de otro usuario.',
      );
    }
    return this.readingHistoryService.findAllByUser(actualUserId);
  }

  @Get(':id')
  @UseGuards(RolesGuard, PermissionsGuard) // RolesGuard y PermissionsGuard se aplican aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @RequiredPermissions('user_permission') // Los Admins necesitan este permiso para ver historial ajeno
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener un registro de historial de lectura por ID',
    description:
      'Recupera los detalles de un registro específico del historial de lectura. Solo el **propietario** o un **Admin/Superadmin** (con `user_permission`) puede acceder.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del registro de historial de lectura',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial encontrado.',
    type: ReadingHistoryDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario o rol/permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ReadingHistoryDto> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;
    return this.readingHistoryService.findOne(
      id,
      user.auth0_id,
      hasUserPermission,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard) // RolesGuard y PermissionsGuard se aplican aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @RequiredPermissions('user_permission') // Los Admins necesitan este permiso para actualizar historial ajeno
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Actualizar un registro de historial de lectura por ID',
    description:
      'Permite al propietario del registro o a un **Admin/Superadmin** (con `user_permission`) actualizar un registro existente del historial de lectura. Un **Admin** no puede modificar el historial de un **Superadmin**.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del registro de historial de lectura a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial actualizado exitosamente.',
    type: ReadingHistoryDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario, rol/permiso insuficiente, o intento de modificar historial de Superadmin).',
  })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateReadingHistoryDto: UpdateReadingHistoryDto,
  ): Promise<ReadingHistoryDto> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;
    // Pasar el ID de Auth0 del usuario actual y el permiso al servicio para las comprobaciones de rol
    return this.readingHistoryService.update(
      id,
      user.auth0_id, // Pasar el ID de Auth0
      updateReadingHistoryDto,
      hasUserPermission,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard) // RolesGuard y PermissionsGuard se aplican aquí
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @RequiredPermissions('user_permission') // Los Admins necesitan este permiso para eliminar historial ajeno
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content
  @ApiOperation({
    summary: 'Eliminar un registro de historial de lectura por ID',
    description:
      'Permite al propietario del registro o a un **Admin/Superadmin** (con `user_permission`) eliminar un registro existente del historial de lectura. Un **Admin** no puede eliminar el historial de un **Superadmin**.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del registro de historial de lectura a eliminar',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Historial eliminado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description:
      'No autorizado (no es el propietario, rol/permiso insuficiente, o intento de eliminar historial de Superadmin).',
  })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;
    // Pasar el ID de Auth0 del usuario actual y el permiso al servicio para las comprobaciones de rol
    await this.readingHistoryService.remove(
      id,
      user.auth0_id, // Pasar el ID de Auth0
      hasUserPermission,
    );
  }
}
