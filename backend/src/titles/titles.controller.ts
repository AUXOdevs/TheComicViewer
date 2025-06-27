// src/titles/titles.controller.ts
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
  Query, // Para usar @Query() con GetAllTitlesDto
  BadRequestException,
  ConflictException,
  NotFoundException, // Importación necesaria
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { TitlesService } from './titles.service';
import { CreateTitleDto } from './dto/create-title.dto'; // Asumido que existe
import { UpdateTitleDto } from './dto/update-title.dto'; // Asumido que existe
import { TitleDto } from './dto/title.dto'; // Asumido que existe
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery, // Para documentar los parámetros de query
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator';
import { GetAllTitlesDto } from './dto/get-all-titles.dto'; // Importamos el nuevo DTO
import { plainToInstance } from 'class-transformer'; // Necesario para transformar a DTOs

@ApiTags('titles') // Agrupa este controlador bajo la etiqueta 'titles' en Swagger
@Controller('titles')
export class TitlesController {
  private readonly logger = new Logger(TitlesController.name);

  constructor(private readonly titlesService: TitlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('content_permission')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear un nuevo título (Solo Admin/Superadmin con permiso de contenido)',
    description:
      'Registra un nuevo título en la base de datos con su información básica. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Título creado exitosamente.',
    type: TitleDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({
    status: 409,
    description: 'Un título con este nombre ya existe.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async create(@Body() createTitleDto: CreateTitleDto): Promise<TitleDto> {
    this.logger.log(
      `create(): Intentando crear nuevo título: ${createTitleDto.name}`,
    );
    try {
      const title = await this.titlesService.create(createTitleDto);
      return plainToInstance(TitleDto, title);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        this.logger.warn(`create(): Error al crear título: ${error.message}`);
        throw error; // Relanzar excepciones de cliente controladas
      }
      this.logger.error(
        `create(): Error interno al crear título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al crear el título.',
      );
    }
  }

  @Get()
  // Nota: Dejé esta ruta sin JwtAuthGuard para que sea pública, como se discutió.
  // Si deseas que solo los usuarios autenticados puedan ver la lista de títulos, añade @UseGuards(JwtAuthGuard) aquí.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener lista de todos los títulos con paginación, filtros y ordenación',
    description:
      'Lista todos los títulos disponibles. Soporta paginación, filtrado por nombre y ordenación. **Acceso público**.',
  })
  // Las decoraciones @ApiQuery se definen en GetAllTitlesDto para claridad y consistencia.
  // Puedes agregarlas aquí si prefieres tenerlas explícitamente en el controlador para Swagger UI.
  // Por ejemplo: @ApiQuery({ name: 'page', type: Number, required: false, description: 'Número de página.' })
  @ApiResponse({
    status: 200,
    description: 'Lista de títulos.',
    schema: {
      type: 'object',
      properties: {
        titles: {
          type: 'array',
          items: { $ref: '#/components/schemas/TitleDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findAll(
    @Query() queryParams: GetAllTitlesDto, // Un solo DTO para todos los parámetros de consulta
  ): Promise<{
    titles: TitleDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(
      `findAll(): Buscando títulos con filtros: ${JSON.stringify(queryParams)}`,
    );
    try {
      // El servicio ahora recibirá el DTO completo
      const { titles, total } = await this.titlesService.findAll(queryParams);
      return {
        titles: plainToInstance(TitleDto, titles),
        total,
        page: queryParams.page || 1,
        limit: queryParams.limit || 10,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Por si el servicio valida los parámetros
        this.logger.warn(
          `findAll(): Error en los parámetros de consulta: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `findAll(): Error interno al obtener títulos: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener la lista de títulos.',
      );
    }
  }

  @Get('by-name')
  // Nota: Puedes decidir si esta ruta también requiere autenticación o es pública.
  // Por ahora, la dejaré pública como se sugirió inicialmente.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar un título por su nombre',
    description:
      'Permite buscar un título específico por su nombre (búsqueda exacta o parcial, insensible a mayúsculas/minúsculas). **Acceso público**.',
  })
  @ApiQuery({
    name: 'name',
    description: 'Nombre del título a buscar (ej. "One Piece").',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Título encontrado.',
    type: TitleDto,
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findByName(@Query('name') name: string): Promise<TitleDto> {
    this.logger.log(`findByName(): Buscando título con nombre: ${name}`);
    try {
      const title = await this.titlesService.findByName(name);
      return plainToInstance(TitleDto, title);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `findByName(): Título con nombre "${name}" no encontrado.`,
        );
        throw error;
      }
      this.logger.error(
        `findByName(): Error interno al buscar título por nombre: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener el título por nombre.',
      );
    }
  }

  @Get(':id')
  // Nota: Dejé esta ruta sin JwtAuthGuard para que sea pública, como se discutió.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un título por su ID único',
    description:
      'Recupera los detalles de un título específico. **Acceso público**.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del título (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Título encontrado.',
    type: TitleDto,
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findOne(@Param('id') id: string): Promise<TitleDto> {
    this.logger.log(`findOne(): Buscando título con ID: ${id}`);
    try {
      const title = await this.titlesService.findOne(id);
      return plainToInstance(TitleDto, title);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`findOne(): Título con ID "${id}" no encontrado.`);
        throw error;
      }
      this.logger.error(
        `findOne(): Error interno al buscar título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener el título.',
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('content_permission')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar la información de un título',
    description:
      'Modifica los detalles de un título existente (nombre, descripción, etc.). Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del título a actualizar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Título actualizado exitosamente.',
    type: TitleDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto (ej. nuevo nombre de título ya en uso).',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async update(
    @Param('id') id: string,
    @Body() updateTitleDto: UpdateTitleDto,
  ): Promise<TitleDto> {
    this.logger.log(`update(): Intentando actualizar título con ID: ${id}`);
    try {
      const updatedTitle = await this.titlesService.update(id, updateTitleDto);
      return plainToInstance(TitleDto, updatedTitle);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        this.logger.warn(
          `update(): Error al actualizar título: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `update(): Error interno al actualizar título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al actualizar el título.',
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'superadmin')
  @RequiredPermissions('content_permission')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un título',
    description:
      'Elimina un título de la base de datos. Solo accesible por **Admin** y **Superadmin** con permiso de gestión de contenido.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del título a eliminar',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Título eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`remove(): Intentando eliminar título con ID: ${id}`);
    try {
      await this.titlesService.remove(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `remove(): Título con ID "${id}" no encontrado o no se puede eliminar: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `remove(): Error interno al eliminar título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al eliminar el título.',
      );
    }
  }
}
