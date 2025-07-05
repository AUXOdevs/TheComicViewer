// src/reading-history/reading-history.controller.ts
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
import {
  GetAllReadingHistoryDto,
  OrderDirection,
} from './dto/get-all-reading-history.dto'; // Importar el nuevo DTO y enum

@ApiTags('reading-history')
@Controller('reading-history')
@UseGuards(JwtAuthGuard)
export class ReadingHistoryController {
  constructor(private readonly readingHistoryService: ReadingHistoryService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar o actualizar el progreso de lectura de un capítulo',
    description:
      'Permite a cualquier usuario autenticado registrar el progreso de lectura de un capítulo o actualizarlo si ya existe. Los **Admins/Superadmins** con `user_permission` pueden hacerlo para **cualquier usuario** especificando `userId` en el query param. Los usuarios `Registrado` y `Suscrito` solo pueden gestionar su propio historial.',
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
    @Query('userId') targetUserIdQueryParam?: string,
  ): Promise<ReadingHistoryDto> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;

    const actualUserIdForHistory =
      hasUserPermission && targetUserIdQueryParam
        ? targetUserIdQueryParam
        : user.auth0_id;

    if (!actualUserIdForHistory) {
      throw new ForbiddenException(
        'Se debe proporcionar un ID de usuario o debe estar logueado.',
      );
    }

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
  @UseGuards(RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener el historial de lectura del usuario autenticado o de otro usuario (sin filtros avanzados)',
    description:
      'Lista todos los registros del historial de lectura. Un usuario normal ve su propio historial. Un **Admin/Superadmin** con `user_permission` puede ver el historial de cualquier usuario especificando `userId` como Query Param. Para filtros avanzados, use `/filtered`.',
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
    @Query('userId') targetUserIdQueryParam?: string,
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

  // --- NUEVA RUTA: Obtener historial de lectura con paginación y filtros ---
  @Get('filtered')
  @UseGuards(RolesGuard) // Esta ruta puede ser accedida por cualquier usuario autenticado
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener historial de lectura con paginación, filtros y ordenación',
    description:
      'Lista los registros del historial de lectura del usuario autenticado, con opciones de paginación, filtrado por nombre de título, nombre de capítulo y estado de completado. Los **Admins/Superadmins** con `user_permission` pueden filtrar por `userId` o `username` para ver el historial de otros usuarios.',
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
      'Columna por la que ordenar (ej. `updated_at`, `title.name`, `chapter.chapter_number`). Por defecto: `updated_at`.',
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
    description:
      'ID del usuario cuyo historial se desea ver (solo para Admin/Superadmin con `user_permission`). Si no se provee, se usa el ID del usuario autenticado.',
  })
  @ApiQuery({
    name: 'username',
    type: String,
    required: false,
    description:
      'Filtrar historial por el nombre de usuario (solo para Admin/Superadmin con `user_permission`).',
  })
  @ApiQuery({
    name: 'titleName',
    type: String,
    required: false,
    description:
      'Filtrar historial por el nombre del título (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiQuery({
    name: 'chapterName',
    type: String,
    required: false,
    description:
      'Filtrar historial por el nombre del capítulo (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiQuery({
    name: 'completed',
    type: Boolean,
    required: false,
    description: 'Filtrar historial por estado de completado (true/false).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de historial de lectura con paginación y filtros.',
    schema: {
      type: 'object',
      properties: {
        histories: {
          type: 'array',
          items: { $ref: '#/components/schemas/ReadingHistoryDto' },
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
    description: 'No autorizado (intento de ver historial ajeno sin permisos).',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAllPaginatedAndFiltered(
    @Request() req,
    @Query() queryParams: GetAllReadingHistoryDto,
  ): Promise<{
    histories: ReadingHistoryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const user = req.user as User;
    const hasUserPermission =
      (user.role?.name === 'admin' || user.role?.name === 'superadmin') &&
      user.admin?.user_permission;

    return this.readingHistoryService.findAllPaginatedAndFiltered(
      queryParams,
      user.auth0_id,
      hasUserPermission,
    );
  }
  // --- FIN NUEVA RUTA ---

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
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
  @UseGuards(RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
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
    return this.readingHistoryService.update(
      id,
      user.auth0_id,
      updateReadingHistoryDto,
      hasUserPermission,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
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
    await this.readingHistoryService.remove(
      id,
      user.auth0_id,
      hasUserPermission,
    );
  }
}
