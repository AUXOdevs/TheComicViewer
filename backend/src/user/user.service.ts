// src/user/user.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { Role } from '../roles/entities/role.entity';
import { RolesRepository } from '../roles/roles.repository';
import { plainToInstance } from 'class-transformer';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rolesRepository: RolesRepository,
  ) {}

  /**
   * Creates a new user.
   * @param createUserDto Data to create the user.
   * @returns The created UserDto.
   * @throws BadRequestException if auth0_id or email already exist, or if the role_id is invalid.
   */
  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const existingUserByAuth0Id = await this.userRepository.findByAuth0Id(
      createUserDto.auth0_id,
    );
    if (existingUserByAuth0Id) {
      throw new BadRequestException(
        `User with Auth0 ID "${createUserDto.auth0_id}" already exists.`,
      );
    }

    const existingUserByEmail = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUserByEmail) {
      throw new BadRequestException(
        `User with email "${createUserDto.email}" already exists.`,
      );
    }

    // --- CÓDIGO FALTANTE: ASIGNACIÓN DE ROL ---
    let role: Role | undefined;
    if (createUserDto.role_id) {
      role = await this.rolesRepository.findOne({
        where: { role_id: createUserDto.role_id },
      });
      if (!role) {
        throw new BadRequestException(
          `Role with ID "${createUserDto.role_id}" not found.`,
        );
      }
    } else {
      // Intenta encontrar el rol por defecto 'Registrado'
      role = await this.rolesRepository.findByName('Registrado');
      if (!role) {
        throw new BadRequestException(
          'Default role "Registrado" not found. Please ensure it exists.',
        );
      }
    }
    // --- FIN CÓDIGO FALTANTE ---

    const newUser = this.userRepository.create({
      ...createUserDto,
      role: role, // 'role' ahora está definido
      last_login: new Date(),
      created_at: new Date(),
      is_blocked: false,
    });

    const savedUser = (await this.userRepository.save(newUser)) as User;

    const userWithRole = await this.userRepository.findUserWithRole(
      savedUser.auth0_id, // Usar auth0_id
    );
    if (!userWithRole) {
      throw new NotFoundException('User not found after creation.');
    }
    return plainToInstance(UserDto, userWithRole);
  }

  /**
   * Finds all users.
   * @returns An array of UserDto.
   */
  async findAll(): Promise<UserDto[]> {
    const users = await this.userRepository.find(); // find() con QueryBuilder ya carga la relación
    return plainToInstance(UserDto, users);
  }

  /**
   * Finds a single user by their ID (auth0_id).
   * @param id The user's auth0_id.
   * @returns The UserDto of the found user.
   * @throws NotFoundException if the user is not found.
   */
  async findOne(id: string): Promise<UserDto> {
    const user = await this.userRepository.findUserWithRole(id); // 'id' es el auth0_id
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return plainToInstance(UserDto, user);
  }

  /**
   * Updates an existing user.
   * @param id The auth0_id of the user to update.
   * @param updateUserDto Data to update the user.
   * @returns The updated UserDto.
   * @throws NotFoundException if the user is not found.
   * @throws BadRequestException if the new role_id is invalid.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.userRepository.findUserWithRole(id); // 'id' es el auth0_id
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    if (updateUserDto.role_id !== undefined) {
      // Usar !== undefined para permitir null
      if (updateUserDto.role_id === null) {
        user.role = null; // Establecer rol a null si se envía null
      } else {
        const newRole = await this.rolesRepository.findOne({
          where: { role_id: updateUserDto.role_id },
        });
        if (!newRole) {
          throw new BadRequestException(
            `Role with ID "${updateUserDto.role_id}" not found.`,
          );
        }
        user.role = newRole;
      }
    }

    if (updateUserDto.name !== undefined) user.name = updateUserDto.name;
    if (updateUserDto.picture !== undefined)
      user.picture = updateUserDto.picture;
    if (updateUserDto.is_blocked !== undefined)
      user.is_blocked = updateUserDto.is_blocked;

    const updatedUser = (await this.userRepository.save(user)) as User;

    const userWithUpdatedRole = await this.userRepository.findUserWithRole(
      updatedUser.auth0_id, // Usar auth0_id
    );
    if (!userWithUpdatedRole) {
      throw new NotFoundException('User not found after update.');
    }
    return plainToInstance(UserDto, userWithUpdatedRole);
  }

  /**
   * Removes a user from the database.
   * @param id The auth0_id of the user to remove.
   * @returns void.
   * @throws NotFoundException if the user is not found.
   */
  async remove(id: string): Promise<void> {
    // findOne en UserRepository ahora buscará por auth0_id si se pasa como tal
    const user = await this.userRepository.findOne({ where: { auth0_id: id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    await this.userRepository.remove(user);
  }
}
