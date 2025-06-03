// src/roles/roles.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

  /**
   * Crea un nuevo rol en la base de datos.
   * Realiza validaciones de negocio como la existencia de un rol con el mismo nombre.
   * @param createRoleDto Datos para crear el rol.
   * @returns El RoleDto del rol creado.
   */
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

  /**
   * Obtiene todos los roles de la base de datos.
   * @returns Un array de RoleDto.
   */
  async findAll(): Promise<RoleDto[]> {
    const roles = await this.rolesRepository.find();
    return plainToInstance(RoleDto, roles);
  }

  /**
   * Busca un rol específico por su ID.
   * @param id El ID del rol.
   * @returns El RoleDto del rol encontrado.
   * @throws NotFoundException Si el rol no se encuentra.
   */
  async findOne(id: string): Promise<RoleDto> {
    const role = await this.rolesRepository.findOne({ where: { role_id: id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return plainToInstance(RoleDto, role);
  }

  /**
   * Busca todos los usuarios que tienen un rol específico.
   * @param roleId El ID del rol.
   * @returns Un array de UserDto.
   * @throws NotFoundException Si el rol no se encuentra o no hay usuarios para ese rol.
   */
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

  /**
   * Actualiza un rol existente por su ID.
   * @param id El ID del rol a actualizar.
   * @param updateRoleDto Datos para actualizar el rol.
   * @returns El RoleDto del rol actualizado.
   * @throws NotFoundException Si el rol no se encuentra.
   * @throws BadRequestException Si el nuevo nombre del rol ya existe.
   */
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

  /**
   * Elimina un rol por su ID.
   * Incluye lógica para reasignar usuarios antes de la eliminación y proteger roles críticos.
   * @param id El ID del rol a eliminar.
   * @returns void.
   * @throws NotFoundException Si el rol no se encuentra.
   * @throws BadRequestException Si se intenta eliminar un rol crítico o si no se puede reasignar a un rol por defecto.
   */
  async remove(id: string): Promise<void> {
    const roleToDelete = await this.rolesRepository.findOne({
      where: { role_id: id },
    });
    if (!roleToDelete) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }

    // Definimos los roles críticos que no pueden ser eliminados
    const CRITICAL_ROLES = ['Registrado', 'Suscrito'];

    if (CRITICAL_ROLES.includes(roleToDelete.name)) {
      throw new BadRequestException(
        `Cannot delete the critical role "${roleToDelete.name}".`,
      );
    }

    // Buscamos el rol por defecto para reasignación, que es 'Registrado'
    const defaultRole = await this.rolesRepository.findByName('Registrado');

    if (!defaultRole) {
      throw new BadRequestException(
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
