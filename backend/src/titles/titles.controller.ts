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
import { TitlesService } from './titles.service';
import { CreateTitleDto } from './dto/create-title.dto';
import { UpdateTitleDto } from './dto/update-title.dto';
import { TitleDto } from './dto/title.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('titles')
@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo título (solo Admin)' })
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
    description: 'No autorizado (rol requerido: admin).',
  })
  async create(@Body() createTitleDto: CreateTitleDto): Promise<TitleDto> {
    return this.titlesService.create(createTitleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los títulos (Acceso público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de títulos.',
    type: [TitleDto],
  })
  async findAll(): Promise<TitleDto[]> {
    return this.titlesService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un título por ID (Acceso público)' })
  @ApiResponse({
    status: 200,
    description: 'Título encontrado.',
    type: TitleDto,
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async findOne(@Param('id') id: string): Promise<TitleDto> {
    return this.titlesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un título por ID (solo Admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Título actualizado exitosamente.',
    type: TitleDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() updateTitleDto: UpdateTitleDto,
  ): Promise<TitleDto> {
    return this.titlesService.update(id, updateTitleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un título por ID (solo Admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 204, description: 'Título eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.titlesService.remove(id);
  }
}
