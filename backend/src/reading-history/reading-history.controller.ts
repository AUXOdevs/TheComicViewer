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
import { ReadingHistoryService } from './reading-history.service';
import { CreateReadingHistoryDto } from './dto/create-reading-history.dto';
import { UpdateReadingHistoryDto } from './dto/update-reading-history.dto';
import { ReadingHistoryDto } from './dto/reading-history.dto';
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

@ApiTags('reading-history')
@Controller('reading-history')
@UseGuards(JwtAuthGuard) // Todas las rutas requieren autenticación
export class ReadingHistoryController {
  constructor(private readonly readingHistoryService: ReadingHistoryService) {}

  @Post()
  @Roles('Registrado', 'Suscrito', 'admin') // Cualquier usuario autenticado puede registrar/actualizar su historial
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar o actualizar el progreso de lectura de un capítulo',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Historial creado/actualizado exitosamente.',
    type: ReadingHistoryDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Capítulo no encontrado.' })
  async createOrUpdate(
    @Request() req,
    @Body() createReadingHistoryDto: CreateReadingHistoryDto,
  ): Promise<ReadingHistoryDto> {
    const userId = (req.user as User).auth0_id;
    return this.readingHistoryService.createOrUpdate(
      userId,
      createReadingHistoryDto,
    );
  }

  @Get()
  @Roles('Registrado', 'Suscrito', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todo el historial de lectura del usuario autenticado',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Lista de historial de lectura.',
    type: [ReadingHistoryDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'No autorizado.' })
  async findAllByUser(@Request() req): Promise<ReadingHistoryDto[]> {
    const userId = (req.user as User).auth0_id;
    return this.readingHistoryService.findAllByUser(userId);
  }

  @Get(':id')
  @Roles('Registrado', 'Suscrito', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener un registro de historial de lectura por ID (solo el usuario propietario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Historial encontrado.',
    type: ReadingHistoryDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario del historial).',
  })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ReadingHistoryDto> {
    const userId = (req.user as User).auth0_id;
    return this.readingHistoryService.findOne(id, userId);
  }

  @Patch(':id')
  @Roles('Registrado', 'Suscrito', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Actualizar un registro de historial de lectura por ID (solo el usuario propietario)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Historial actualizado exitosamente.',
    type: ReadingHistoryDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario del historial).',
  })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateReadingHistoryDto: UpdateReadingHistoryDto,
  ): Promise<ReadingHistoryDto> {
    const userId = (req.user as User).auth0_id;
    return this.readingHistoryService.update(
      id,
      userId,
      updateReadingHistoryDto,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Registrado', 'Suscrito', 'admin') // Cualquier usuario autenticado puede eliminar su historial, o admin el de otros
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Eliminar un registro de historial de lectura por ID (propietario o Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 204,
    description: 'Historial eliminado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'No autorizado (no es el propietario o rol insuficiente).',
  })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as User;
    const isAdmin = user.role?.name === 'admin';
    await this.readingHistoryService.remove(id, user.auth0_id, isAdmin);
  }
}
