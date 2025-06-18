import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  HttpStatus,
  HttpCode,
  UseGuards, // Importar UseGuards
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserDto } from '../user/dto/user.dto'; // Importa UserDto
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Importar
import { RolesGuard } from '../auth/guards/roles.guard'; // Importar
import { Roles } from '../auth/decorators/roles.decorator'; // Importar

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard) // Aplicar protección a todo el controlador
@Roles('superadmin') // Solo superadmins pueden gestionar roles
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleDto> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  // Esta ruta podría ser más flexible, quizás 'admin' también puede ver los roles
  @Roles('admin', 'superadmin')
  async findAll(): Promise<RoleDto[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  // Esta ruta también podría ser más flexible
  @Roles('admin', 'superadmin')
  async findOne(@Param('id') id: string): Promise<RoleDto> {
    const role = await this.rolesService.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return role;
  }

  @Get(':id/users')
  // ¿Quién puede ver qué usuarios tienen qué rol? Generalmente admins y superadmins.
  @Roles('admin', 'superadmin')
  async findUsersByRoleId(@Param('id') id: string): Promise<UserDto[]> {
    const users = await this.rolesService.findUsersByRoleId(id);
    if (!users || users.length === 0) {
      throw new NotFoundException(`No users found for role with ID "${id}".`);
    }
    return users;
  }

  @Put(':id')
  // Solo superadmin puede actualizar roles (incluyendo sus nombres)
  @Roles('superadmin')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleDto> {
    const updatedRole = await this.rolesService.update(id, updateRoleDto);
    if (!updatedRole) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return updatedRole;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('superadmin') // Solo superadmin puede eliminar roles
  async remove(@Param('id') id: string): Promise<void> {
    await this.rolesService.remove(id);
  }
}
