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
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo género (solo Admin)' })
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
    description: 'No autorizado (rol requerido: admin).',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un género por ID (solo Admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Género actualizado exitosamente.',
    type: GenreDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un género por ID (solo Admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 204, description: 'Género eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.genresService.remove(id);
  }
}
