// src/chapters/chapters.controller.ts
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
  Query,
  Request,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ChapterDto } from './dto/chapter.dto';
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
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';
import { User } from 'src/user/entities/user.entity';
import { GetAllChaptersDto } from './dto/get-all-chapters.dto';

@ApiTags('chapters')
@Controller('chapters')
export class ChaptersController {
  private readonly logger = new Logger(ChaptersController.name);

  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('content_permission')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear un nuevo capítulo (Solo Admin/Superadmin con permiso de contenido)',
    description:
      'Permite añadir un nuevo capítulo a un título existente. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Capítulo creado exitosamente.',
    type: ChapterDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Título asociado no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un capítulo con el mismo número para este título.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async create(
    @Body() createChapterDto: CreateChapterDto,
  ): Promise<ChapterDto> {
    this.logger.log(
      `create(): Intentando crear capítulo para el título ID: ${createChapterDto.title_id}`,
    );
    try {
      const chapter = await this.chaptersService.create(createChapterDto);
      return chapter; // El servicio ya devuelve ChapterDto
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        this.logger.warn(`create(): Error al crear capítulo: ${error.message}`);
        throw error;
      }
      this.logger.error(
        `create(): Error interno al crear capítulo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al crear el capítulo.',
      );
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener lista de todos los capítulos con paginación, filtros y ordenación',
    description:
      'Lista todos los capítulos disponibles. Soporta paginación, filtrado por nombre de capítulo, número de capítulo, ID de título y nombre de título. **Acceso público**.',
  })
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
      'Columna por la que ordenar (ej. `created_at`, `name`, `chapter_number`, `release_date`). Por defecto: `created_at`.',
  })
  @ApiQuery({
    name: 'order',
    enum: ['ASC', 'DESC'],
    required: false,
    description:
      'Dirección de la ordenación (ASC o DESC). Por defecto: `DESC`.',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
    description:
      'Filtrar capítulos por nombre (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiQuery({
    name: 'chapterNumber',
    type: Number,
    required: false,
    description: 'Filtrar capítulos por número de capítulo exacto.',
  })
  @ApiQuery({
    name: 'titleId',
    type: String,
    required: false,
    description:
      'Filtrar capítulos por el ID exacto del título al que pertenecen.',
  })
  @ApiQuery({
    name: 'titleName',
    type: String,
    required: false,
    description:
      'Filtrar capítulos por el nombre del título al que pertenecen (búsqueda parcial, insensible a mayúsculas/minúsculas).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de capítulos con paginación.',
    schema: {
      type: 'object',
      properties: {
        chapters: {
          type: 'array',
          items: { $ref: '#/components/schemas/ChapterDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAll(
    @Query() queryParams: GetAllChaptersDto,
  ): Promise<{
    chapters: ChapterDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(
      `findAll(): Buscando capítulos con filtros: ${JSON.stringify(queryParams)}`,
    );
    try {
      const { chapters, total } =
        await this.chaptersService.findAll(queryParams);
      return {
        chapters,
        total,
        page: queryParams.page || 1,
        limit: queryParams.limit || 10,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.logger.warn(
          `findAll(): Error en los parámetros de consulta: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `findAll(): Error interno al obtener capítulos: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener la lista de capítulos.',
      );
    }
  }

  @Get('by-name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener capítulos por su nombre',
    description:
      'Busca capítulos por su nombre (búsqueda parcial, insensible a mayúsculas/minúsculas). Puede devolver múltiples capítulos si los nombres no son únicos entre títulos. **Acceso público**.',
  })
  @ApiQuery({
    name: 'name',
    description: 'Nombre del capítulo a buscar.',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Capítulo(s) encontrado(s).',
    type: [ChapterDto],
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findByName(@Query('name') name: string): Promise<ChapterDto[]> {
    this.logger.log(`findByName(): Buscando capítulos con nombre: ${name}`);
    try {
      const chapters = await this.chaptersService.findByName(name);
      return chapters;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `findByName(): Capítulo con nombre "${name}" no encontrado.`,
        );
        throw error;
      }
      this.logger.error(
        `findByName(): Error interno al buscar capítulo por nombre: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener el capítulo por nombre.',
      );
    }
  }

  @Get('by-title-name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener todos los capítulos de un título específico por el nombre del título',
    description:
      'Lista todos los capítulos asociados a un nombre de título dado. **Acceso público**.',
  })
  @ApiQuery({
    name: 'titleName',
    description: 'Nombre del título (ej. "One Piece").',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de capítulos.',
    type: [ChapterDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Título no encontrado o sin capítulos.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAllByTitleName(
    @Query('titleName') titleName: string,
  ): Promise<ChapterDto[]> {
    this.logger.log(
      `findAllByTitleName(): Buscando capítulos para el título con nombre: ${titleName}`,
    );
    try {
      const chapters = await this.chaptersService.findAllByTitleName(titleName);
      return chapters;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `findAllByTitleName(): Título con nombre "${titleName}" no encontrado o sin capítulos.`,
        );
        throw error;
      }
      this.logger.error(
        `findAllByTitleName(): Error interno al buscar capítulos por nombre de título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener los capítulos por nombre de título.',
      );
    }
  }

  @Get('by-title/:titleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los capítulos de un título específico por su ID',
    description:
      'Lista todos los capítulos asociados a un ID de título dado. **Acceso público**.',
  })
  @ApiParam({
    name: 'titleId',
    description: 'ID único del título',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de capítulos.',
    type: [ChapterDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Título no encontrado o sin capítulos.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAllByTitleId(
    @Param('titleId') titleId: string,
  ): Promise<ChapterDto[]> {
    this.logger.log(
      `findAllByTitleId(): Buscando capítulos para el título con ID: ${titleId}`,
    );
    try {
      const chapters = await this.chaptersService.findAllByTitleId(titleId);
      return chapters;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `findAllByTitleId(): Título con ID "${titleId}" no encontrado o sin capítulos.`,
        );
        throw error;
      }
      this.logger.error(
        `findAllByTitleId(): Error interno al buscar capítulos por ID de título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener los capítulos por ID de título.',
      );
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un capítulo por su ID',
    description:
      'Recupera los detalles de un capítulo específico. **Acceso público**, pero el contenido puede ser limitado para usuarios no suscritos.',
  })
  @ApiParam({ name: 'id', description: 'ID único del capítulo', type: String })
  @ApiResponse({
    status: 200,
    description: 'Capítulo encontrado.',
    type: ChapterDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Acceso limitado (para no suscritos si el contenido es premium).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findOne(@Param('id') id: string, @Request() req): Promise<ChapterDto> {
    this.logger.log(`findOne(): Buscando capítulo con ID: ${id}.`);
    try {
      const user = req['user'] as User;
      const isAuthenticated = !!user;
      const userRole = user?.role?.name;
      const chapter = await this.chaptersService.findOne(
        id,
        isAuthenticated,
        userRole,
      );
      return chapter;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `findOne(): Error al buscar capítulo con ID "${id}": ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `findOne(): Error interno al buscar capítulo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener el capítulo.',
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('content_permission')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Actualizar un capítulo por su ID (Solo Admin/Superadmin con permiso de contenido)',
    description:
      'Modifica los detalles de un capítulo existente. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del capítulo a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Capítulo actualizado exitosamente.',
    type: ChapterDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflicto (ej. el número de capítulo ya existe para este título).',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async update(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ): Promise<ChapterDto> {
    this.logger.log(`update(): Intentando actualizar capítulo con ID: ${id}`);
    try {
      const updatedChapter = await this.chaptersService.update(
        id,
        updateChapterDto,
      );
      return updatedChapter;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        this.logger.warn(
          `update(): Error al actualizar capítulo: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `update(): Error interno al actualizar capítulo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al actualizar el capítulo.',
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('content_permission')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Eliminar un capítulo por su ID (Solo Admin/Superadmin con permiso de contenido)',
    description:
      'Elimina un capítulo existente. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del capítulo a eliminar',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Capítulo eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`remove(): Intentando eliminar capítulo con ID: ${id}`);
    try {
      await this.chaptersService.remove(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `remove(): Error al eliminar capítulo: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `remove(): Error interno al eliminar capítulo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al eliminar el capítulo.',
      );
    }
  }
}
