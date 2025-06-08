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
} from '@nestjs/common';
import { TitleGenreService } from './title-genre.service';
import { CreateTitleGenreDto } from './dto/create-title-genre.dto';
import { TitleGenreDto } from './dto/title-genre.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('title-genre')
@Controller('title-genre')
export class TitleGenreController {
  constructor(private readonly titleGenreService: TitleGenreService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asociar un título con un género (solo Admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Asociación creada exitosamente.',
    type: TitleGenreDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Título o género no encontrado.' })
  @ApiResponse({ status: 409, description: 'La asociación ya existe.' })
  async create(
    @Body() createTitleGenreDto: CreateTitleGenreDto,
  ): Promise<TitleGenreDto> {
    return this.titleGenreService.create(createTitleGenreDto);
  }

  @Get('by-title/:titleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener géneros asociados a un título (Acceso público)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asociaciones título-género.',
    type: [TitleGenreDto],
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async findAllByTitle(
    @Param('titleId') titleId: string,
  ): Promise<TitleGenreDto[]> {
    return this.titleGenreService.findAllByTitle(titleId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una asociación título-género por ID (solo Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 204,
    description: 'Asociación eliminada exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Asociación no encontrada.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.titleGenreService.remove(id);
  }
}
