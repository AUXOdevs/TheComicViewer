import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards, // Asegúrate de importar UseGuards
} from '@nestjs/common';
import { GenresService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { GenreDto } from './dto/genre.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam, // Asegúrate de importar ApiParam para documentar el ID
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard'; // Importar
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator'; // Importar

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Añadir PermissionsGuard
  @Roles('admin', 'superadmin') // Rol: Admin o Superadmin
  @RequiredPermissions('content_permission') // Permiso requerido para contenido
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear un nuevo género (Solo Admin/Superadmin con permiso de contenido)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Género creado exitosamente.',
    type: GenreDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 409, description: 'El género ya existe.' })
  async create(@Body() createGenreDto: CreateGenreDto): Promise<GenreDto> {
    return this.genresService.create(createGenreDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los géneros (Acceso público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de géneros.',
    type: [GenreDto],
  })
  async findAll(): Promise<GenreDto[]> {
    return this.genresService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un género por ID (Acceso público)' })
  @ApiParam({ name: 'id', description: 'ID único del género', type: String }) // Documentar el parámetro
  @ApiResponse({
    status: 200,
    description: 'Género encontrado.',
    type: GenreDto,
  })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  async findOne(@Param('id') id: string): Promise<GenreDto> {
    return this.genresService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Añadir PermissionsGuard
  @Roles('admin', 'superadmin') // Rol: Admin o Superadmin
  @RequiredPermissions('content_permission') // Permiso requerido para contenido
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Actualizar un género por ID (Solo Admin/Superadmin con permiso de contenido)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del género a actualizar',
    type: String,
  }) // Documentar el parámetro
  @ApiResponse({
    status: 200,
    description: 'Género actualizado exitosamente.',
    type: GenreDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  @ApiResponse({ status: 409, description: 'El nombre del género ya existe.' })
  async update(
    @Param('id') id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ): Promise<GenreDto> {
    return this.genresService.update(id, updateGenreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Añadir PermissionsGuard
  @Roles('admin', 'superadmin') // Rol: Admin o Superadmin
  @RequiredPermissions('content_permission') // Permiso requerido para contenido
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Eliminar un género por ID (Solo Admin/Superadmin con permiso de contenido)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del género a eliminar',
    type: String,
  }) // Documentar el parámetro
  @ApiResponse({ status: 204, description: 'Género eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.genresService.remove(id);
  }
}
