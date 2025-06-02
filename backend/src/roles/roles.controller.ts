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
} from '@nestjs/common';
import { RolesService } from './roles.service'; // Asume que tienes un servicio para los roles
// import { CreateRoleDto, UpdateRoleDto, RoleDto } from './dto/role.dto';
import { UserDto } from '../user/dto/user.dto'; // Importa UserDto para el endpoint de usuarios por rol
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {} // Inyecta el servicio

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleDto> {
    // Implementa la lógica para crear un rol.
    // Recuerda que IsIn(['Invitado', 'Suscrito', 'Administrador']) ya valida el nombre.
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  async findAll(): Promise<RoleDto[]> {
    // Este ya lo tienes, pero ahora con el tipo de retorno RoleDto[]
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RoleDto> {
    // Permite obtener un rol específico por su ID.
    const role = await this.rolesService.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return role;
  }

  @Get(':id/users')
  async findUsersByRoleId(@Param('id') id: string): Promise<UserDto[]> {
    // Este es el endpoint clave al que se refería el comentario en RoleDto.
    // Permite obtener una lista de todos los usuarios que tienen un rol específico.
    // Esto evita cargar una lista de usuarios directamente en el RoleDto.
    const users = await this.rolesService.findUsersByRoleId(id);
    if (!users || users.length === 0) {
      // Podrías lanzar un NotFoundException si el rol no existe o no tiene usuarios,
      // o simplemente devolver un array vacío si el rol existe pero no tiene usuarios.
      throw new NotFoundException(`No users found for role with ID "${id}".`);
    }
    return users;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleDto> {
    // Permite actualizar un rol, por ejemplo, su nombre si en el futuro se permite.
    // La validación IsIn ya restringirá los nombres permitidos.
    const updatedRole = await this.rolesService.update(id, updateRoleDto);
    if (!updatedRole) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return updatedRole;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content para eliminaciones exitosas
  async remove(@Param('id') id: string): Promise<void> {
    // El servicio ahora lanza excepciones (NotFoundException, BadRequestException)
    // si hay un problema. Si llega hasta aquí sin una excepción, la operación fue exitosa.
    await this.rolesService.remove(id);
    // Ya no necesitas la verificación 'if (!result)' aquí
  }
}
