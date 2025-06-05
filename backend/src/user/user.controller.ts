// src/user/user.controller.ts
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
  Query,
  UseGuards, // Importar UseGuards
  Request, // Para acceder al objeto request
  UnauthorizedException, // Para manejo de permisos
  BadRequestException, // Para manejo de errores
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Importar tu guard
import { RolesGuard } from '../auth/guards/roles.guard'; // Importar RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // Importar Roles decorator
import { User } from './entities/user.entity'; // Importar la entidad User

@Controller('users')
// @UseGuards(JwtAuthGuard) // Proteger todo el controlador con autenticación JWT
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(RolesGuard)
  // @Roles('admin') // Solo usuarios con rol 'admin' pueden crear usuarios
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.userService.create(createUserDto);
  }

  @Get()
  // @UseGuards(RolesGuard)
  // @Roles('admin', 'moderator') // Solo admins o moderadores pueden ver todos los usuarios
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto[]> {
    const bIncludeDeleted = includeDeleted === 'true';
    // La lógica para `includeDeleted` ya está en el servicio.
    // El guard de roles asegura que solo los roles permitidos puedan acceder a esta ruta.
    return this.userService.findAll(bIncludeDeleted);
  }

  // Nueva ruta para ver solo usuarios inhabilitados
  @Get('deactivated')
  @UseGuards(RolesGuard)
  // @Roles('admin') // Solo admins pueden ver usuarios inhabilitados
  async findDeactivatedUsers(): Promise<UserDto[]> {
    return this.userService.findDeactivatedUsers();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req, // Mover el parámetro Request antes del opcional Query
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto> {
    const bIncludeDeleted = includeDeleted === 'true';

    const currentUser = req.user as User;

    // Lógica para que un usuario solo pueda ver su propio perfil,
    // a menos que sea un administrador.
    if (currentUser.auth0_id !== id && currentUser.role?.name !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to view this user profile.',
      );
    }

    // Si `includeDeleted` es true, solo un admin debería poder usarlo
    if (bIncludeDeleted && currentUser.role?.name !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to view deleted user profiles.',
      );
    }

    return this.userService.findOne(id, bIncludeDeleted);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<UserDto> {
    const currentUser = req.user as User;

    // Permitir al usuario actualizar su propio perfil O si es un admin
    if (currentUser.auth0_id !== id && currentUser.role?.name !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this user profile.',
      );
    }
    // Si el usuario no es un admin, asegúrate de que no pueda cambiar su propio rol u otros campos sensibles
    if (currentUser.role?.name !== 'admin' && updateUserDto.role_id) {
      throw new BadRequestException('Users cannot change their own role.');
    }

    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  // @Roles('admin') // Solo admins pueden hacer soft delete
  async softDeleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.softDeleteUser(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  // @Roles('admin') // Solo admins pueden reactivar
  async reactivateUser(@Param('id') id: string): Promise<UserDto> {
    return this.userService.reactivateUser(id);
  }
}
