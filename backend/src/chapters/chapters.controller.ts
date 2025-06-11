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
  Request,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/user/entities/user.entity';

@ApiTags('chapters')
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo capítulo (solo Admin)' })
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
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async create(
    @Body() createChapterDto: CreateChapterDto,
  ): Promise<ChapterDto> {
    return this.chaptersService.create(createChapterDto);
  }

  @Get('by-title/:titleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los capítulos de un título por ID (Acceso público)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de capítulos.',
    type: [ChapterDto],
  })
  @ApiResponse({ status: 404, description: 'Título no encontrado.' })
  async findAllByTitle(
    @Param('titleId') titleId: string,
  ): Promise<ChapterDto[]> {
    return this.chaptersService.findAllByTitle(titleId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un capítulo por ID (Acceso limitado para no suscritos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Capítulo encontrado.',
    type: ChapterDto,
  })
  @ApiResponse({ status: 400, description: 'Acceso limitado (no suscrito).' })
  @ApiResponse({
    status: 401,
    description: 'No autenticado (si la ruta se protege).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async findOne(@Param('id') id: string, @Request() req): Promise<ChapterDto> {
    // Si la ruta no está protegida por JwtAuthGuard (ej. para invitados), req.user será undefined.
    // Usamos el guard para la lógica de roles
    const isAuthenticated = !!req.user;
    const userRole = (req.user as User)?.role?.name; // Acceder al rol del usuario autenticado
    return this.chaptersService.findOne(id, isAuthenticated, userRole);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un capítulo por ID (solo Admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Capítulo actualizado exitosamente.',
    type: ChapterDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ): Promise<ChapterDto> {
    return this.chaptersService.update(id, updateChapterDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un capítulo por ID (solo Admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 204, description: 'Capítulo eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (rol requerido: admin).',
  })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.chaptersService.remove(id);
  }
}
