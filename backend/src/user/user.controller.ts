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
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard) // <-- Proteger TODO el controlador con autenticación JWT
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(RolesGuard) // RolesGuard se aplica después de JwtAuthGuard (por el orden en el decorador de clase)
  @Roles('admin') // Solo usuarios con rol 'admin' pueden crear usuarios
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.userService.create(createUserDto);
  }



  @Get()
  @UseGuards(RolesGuard) // <-- Habilitar este guard para proteger findAll
  @Roles('admin', 'moderator', 'Registrado', 'Suscrito') // Puedes especificar los roles que pueden ver todos los usuarios
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto[]> {
    const bIncludeDeleted = includeDeleted === 'true';
    return this.userService.findAll(bIncludeDeleted);
  }

  @Get('deactivated')
  @UseGuards(RolesGuard)
  @Roles('admin') // Solo admins pueden ver usuarios inhabilitados
  async findDeactivatedUsers(): Promise<UserDto[]> {
    return this.userService.findDeactivatedUsers();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto> {
    const bIncludeDeleted = includeDeleted === 'true';
    const currentUser = req.user as User;

    if (!currentUser) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (currentUser.auth0_id !== id && currentUser.role?.name !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to view this user profile.',
      );
    }

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

    if (!currentUser) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (currentUser.auth0_id !== id && currentUser.role?.name !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this user profile.',
      );
    }
    if (currentUser.role?.name !== 'admin' && updateUserDto.role_id) {
      throw new BadRequestException('Users cannot change their own role.');
    }

    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('admin') // Solo admins pueden hacer soft delete
  async softDeleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.softDeleteUser(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(RolesGuard)
  @Roles('admin') // Solo admins pueden reactivar
  async reactivateUser(@Param('id') id: string): Promise<UserDto> {
    return this.userService.reactivateUser(id);
  }
}
