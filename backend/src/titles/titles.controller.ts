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
  ApiParam, // Asegúrate de importar ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard'; // Importar
import { RequiredPermissions } from 'src/auth/decorators/permissions.decorator'; // Importar

@ApiTags('titles')
@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Añadir PermissionsGuard
  @Roles('admin', 'superadmin') // Rol: Admin o Superadmin
  @RequiredPermissions('content_permission') // Permiso requerido para contenido
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear un nuevo título (Solo Admin/Superadmin con permiso de contenido)',
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
  }) // Añadir 409 para conflicto
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
  @ApiParam({ name: 'id', description: 'ID único del título', type: String }) // Documentar el parámetro
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Añadir PermissionsGuard
  @Roles('admin', 'superadmin') // Rol: Admin o Superadmin
  @RequiredPermissions('content_permission') // Permiso requerido para contenido
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Actualizar un título por ID (Solo Admin/Superadmin con permiso de contenido)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del título a actualizar',
    type: String,
  }) // Documentar el parámetro
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
  async update(
    @Param('id') id: string,
    @Body() updateTitleDto: UpdateTitleDto,
  ): Promise<TitleDto> {
    return this.titlesService.update(id, updateTitleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Añadir PermissionsGuard
  @Roles('admin', 'superadmin') // Rol: Admin o Superadmin
  @RequiredPermissions('content_permission') // Permiso requerido para contenido
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Eliminar un título por ID (Solo Admin/Superadmin con permiso de contenido)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    description: 'ID único del título a eliminar',
    type: String,
  }) // Documentar el parámetro
  @ApiResponse({ status: 204, description: 'Título eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol o permiso insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.titlesService.remove(id);
  }
}
