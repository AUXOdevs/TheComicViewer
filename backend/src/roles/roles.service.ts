// src/roles/roles.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException, // Asegúrate de que esté importado
} from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleDto } from './dto/role.dto';
import { UserDto } from '../user/dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleDto> {
    const existingRole = await this.rolesRepository.findByName(
      createRoleDto.name,
    );
    if (existingRole) {
      throw new BadRequestException(
        `Role with name "${createRoleDto.name}" already exists.`,
      );
    }
    const role = this.rolesRepository.create(createRoleDto);
    const savedRole = await this.rolesRepository.save(role);
    return plainToInstance(RoleDto, savedRole);
  }

  async findAll(): Promise<RoleDto[]> {
    const roles = await this.rolesRepository.find();
    return plainToInstance(RoleDto, roles);
  }

  async findOne(id: string): Promise<RoleDto> {
    const role = await this.rolesRepository.findOne({ where: { role_id: id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return plainToInstance(RoleDto, role);
  }

  async findUsersByRoleId(roleId: string): Promise<UserDto[]> {
    const role = await this.rolesRepository.findOne({
      where: { role_id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found.`);
    }
    const users = await this.rolesRepository.findUsersByRoleId(roleId);
    if (!users || users.length === 0) {
      throw new NotFoundException(
        `No users found for role with ID "${roleId}".`,
      );
    }
    return plainToInstance(UserDto, users);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleDto> {
    const role = await this.rolesRepository.findOne({ where: { role_id: id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.rolesRepository.findByName(
        updateRoleDto.name,
      );
      if (existingRole) {
        throw new BadRequestException(
          `Role with name "${updateRoleDto.name}" already exists.`,
        );
      }
    }

    Object.assign(role, updateRoleDto);
    const updatedRole = await this.rolesRepository.save(role);
    return plainToInstance(RoleDto, updatedRole);
  }

  async remove(id: string): Promise<void> {
    const roleToDelete = await this.rolesRepository.findOne({
      where: { role_id: id },
    });
    if (!roleToDelete) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }

    // Definimos los roles críticos que no pueden ser eliminados
    // ¡Añade 'admin' y 'superadmin' a los roles críticos!
    const CRITICAL_ROLES = ['Registrado', 'Suscrito', 'admin', 'superadmin'];

    if (CRITICAL_ROLES.includes(roleToDelete.name)) {
      throw new BadRequestException(
        `Cannot delete the critical role "${roleToDelete.name}".`,
      );
    }

    // Buscamos el rol por defecto para reasignación, que es 'Registrado'
    const defaultRole = await this.rolesRepository.findByName('Registrado');

    if (!defaultRole) {
      // Esto debería ser un error interno si el rol "Registrado" no existe
      throw new InternalServerErrorException(
        'Cannot delete role: The default "Registrado" role is missing, unable to reassign users.',
      );
    }

    await this.userRepository.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role_id" = $2`,
      [defaultRole.role_id, roleToDelete.role_id],
    );

    await this.rolesRepository.remove(roleToDelete);
  }
}
