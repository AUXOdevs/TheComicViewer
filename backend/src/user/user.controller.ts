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
  ConflictException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from './entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { Auth0UserProvisionDto } from './dto/auth0-user-provision.dto';

@Controller('users')
// ************ CRÍTICO: REMOVER @UseGuards(JwtAuthGuard) A NIVEL DE CLASE ************
// Si lo dejas aquí, bloqueará la ruta '/users/provision' con 401 Unauthorized
// porque el usuario no tiene un rol válido *antes* de ser provisionado.
export class UsersController {
  constructor(private readonly userService: UserService) {}

  // --- RUTA CLAVE: Aprovisionamiento de usuario desde Auth0 ---
  // Esta ruta NO DEBE ESTAR PROTEGIDA por JwtAuthGuard o RolesGuard.
  // Su propósito es ser el PRIMER punto de contacto para usuarios autenticados por Auth0.
  // El frontend enviará el Access Token, pero este endpoint no lo VALIDARÁ con un guard.
  // La lógica de `findOrCreateUserFromAuth0` en el servicio es quien maneja la creación/actualización.
  @Post('provision')
  @HttpCode(HttpStatus.OK)
  async provisionUserFromAuth0(
    @Body() payload: Auth0UserProvisionDto,
  ): Promise<UserDto> {
    console.log(
      '🚧 [BACKEND] Ruta /users/provision - Payload recibido:',
      payload,
    );

    const user = await this.userService.findOrCreateUserFromAuth0(
      payload.auth0Id,
      payload.email,
      payload.name,
      payload.emailVerified,
      payload.picture,
    );
    console.log(
      '✅ [BACKEND] Usuario provisionado/actualizado en DB interna:',
      user.email,
      'Rol:',
      user.role?.name,
    );
    return plainToInstance(UserDto, user);
  }

  // --- Rutas protegidas: Ahora cada una NECESITA SU PROPIO @UseGuards(JwtAuthGuard) ---
  // Las rutas que requieren roles, también @UseGuards(RolesGuard) y @Roles()

  @Post('admin-create')
  @UseGuards(JwtAuthGuard, RolesGuard) // Protegida con JWT y rol de admin
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createByAdmin(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    console.log(
      '🚧 [BACKEND] Ruta /users/admin-create - Creando usuario por admin:',
      createUserDto.email,
    );
    const createdUser = await this.userService.create(createUserDto);
    return plainToInstance(UserDto, createdUser);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) // Protegida con JWT y rol
  @Roles('admin', 'moderator', 'Registrado', 'Suscrito')
  async findAll(
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto[]> {
    console.log('🚧 [BACKEND] Ruta /users - Buscando todos los usuarios.');
    const bIncludeDeleted = includeDeleted === 'true';
    return this.userService.findAll(bIncludeDeleted);
  }

  @Get('deactivated')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findDeactivatedUsers(): Promise<UserDto[]> {
    console.log(
      '🚧 [BACKEND] Ruta /users/deactivated - Buscando usuarios desactivados.',
    );
    return this.userService.findDeactivatedUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Protegida con JWT
  async findOne(
    @Param('id') id: string,
    @Request() req,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<UserDto> {
    console.log(
      `🚧 [BACKEND] Ruta /users/:id - Buscando usuario con ID: ${id}`,
    );
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
  @UseGuards(JwtAuthGuard) // Protegida con JWT
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<UserDto> {
    console.log(
      `🚧 [BACKEND] Ruta /users/:id - Actualizando usuario con ID: ${id}`,
    );
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async softDeleteUser(@Param('id') id: string): Promise<void> {
    console.log(
      `🚧 [BACKEND] Ruta /users/:id - Desactivando usuario con ID: ${id}`,
    );
    await this.userService.softDeleteUser(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reactivateUser(@Param('id') id: string): Promise<UserDto> {
    console.log(
      `🚧 [BACKEND] Ruta /users/:id/reactivate - Reactivando usuario con ID: ${id}`,
    );
    return this.userService.reactivateUser(id);
  }
}
