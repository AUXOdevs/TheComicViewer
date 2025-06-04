import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { Role } from '../roles/entities/role.entity';
import { RolesRepository } from '../roles/roles.repository';
import { AdminService } from '../admins/admins.service';
import { plainToInstance } from 'class-transformer';
import { User } from './entities/user.entity';
import { DataSource, IsNull } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rolesRepository: RolesRepository,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const processedAuth0Id = createUserDto.auth0_id?.startsWith('auth0|')
      ? createUserDto.auth0_id
      : `auth0|${createUserDto.auth0_id}`;

    let existingUser = await this.userRepository.findByAuth0Id(
      processedAuth0Id,
      true,
    );
    if (existingUser) {
      if (existingUser.deleted_at) {
        throw new ConflictException(
          `User with Auth0 ID "${processedAuth0Id}" is deactivated. Consider reactivating.`,
        );
      }
      throw new ConflictException(
        `User with Auth0 ID "${processedAuth0Id}" already exists.`,
      );
    }

    existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
      true,
    );
    if (existingUser) {
      if (existingUser.deleted_at) {
        throw new ConflictException(
          `User with email "${createUserDto.email}" is deactivated. Consider reactivating.`,
        );
      }
      throw new ConflictException(
        `User with email "${createUserDto.email}" already exists.`,
      );
    }

    let role: Role | null = null;
    if (createUserDto.role_id) {
      role = await this.rolesRepository.findOne({
        where: { role_id: createUserDto.role_id },
      });
      if (!role)
        throw new BadRequestException(
          `Role with ID "${createUserDto.role_id}" not found.`,
        );
    } else {
      // Asignar rol por defecto 'Registrado' si no se proporciona
      role = await this.rolesRepository.findByName('Registrado');
      if (!role) {
        console.warn(
          'Default role "Registrado" not found. User will be created without a specific role if role_id is not provided.',
        );
        // Opcional: Si el rol 'Registrado' es MANDATORIO, puedes lanzar una excepción aquí.
        // throw new InternalServerErrorException('Default role "Registrado" not found. Please create it.');
      }
    }

    const userEntity = this.userRepository.create({
      auth0_id: processedAuth0Id,
      name: createUserDto.name || createUserDto.email.split('@')[0],
      email: createUserDto.email,
      email_verified: createUserDto.email_verified || false,
      picture: createUserDto.picture || null,
      role: role, // Asegúrate de asignar el objeto rol
      role_id: role ? role.role_id : null, // Asegúrate de asignar el role_id
    });

    const savedUser = await this.userRepository.save(userEntity);
    // Vuelve a buscar el usuario con la relación de rol cargada
    const userWithRole = await this.userRepository.findUserWithRole(
      savedUser.auth0_id,
    );
    if (!userWithRole)
      throw new InternalServerErrorException(
        'Failed to retrieve user after creation with role.',
      );
    return plainToInstance(UserDto, userWithRole);
  }

  async findAll(includeDeleted = false): Promise<UserDto[]> {
    const users = await this.userRepository.findAll(includeDeleted);
    return plainToInstance(UserDto, users);
  }

  async findDeactivatedUsers(): Promise<UserDto[]> {
    const users = await this.userRepository.findDeactivatedUsers();
    return plainToInstance(UserDto, users);
  }

  async findOne(id: string, includeDeleted = false): Promise<UserDto> {
    const user = await this.userRepository.findUserWithRole(id, includeDeleted);
    if (!user) {
      throw new NotFoundException(
        `User with ID "${id}" not found or does not meet criteria.`,
      );
    }
    return plainToInstance(UserDto, user);
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<UserDto | null> {
    const user = await this.userRepository.findByEmail(email, includeDeleted);
    return user ? plainToInstance(UserDto, user) : null;
  }

  async findByAuth0IdForAuth(auth0Id: string): Promise<UserDto | null> {
    const user = await this.userRepository.findByAuth0Id(auth0Id, true);
    return user ? plainToInstance(UserDto, user) : null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.userRepository.findUserWithRole(id, false);
    if (!user) {
      throw new NotFoundException(`Active user with ID "${id}" not found.`);
    }
    if (user.deleted_at) {
      throw new BadRequestException(
        `User with ID "${id}" is deactivated and cannot be updated.`,
      );
    }

    const { auth0_id, email, deleted_at, ...allowedUpdates } =
      updateUserDto as any;

    if (allowedUpdates.role_id !== undefined) {
      if (allowedUpdates.role_id === null) {
        user.role = null;
        user.role_id = null;
      } else {
        const newRole = await this.rolesRepository.findOne({
          where: { role_id: allowedUpdates.role_id },
        });
        if (!newRole)
          throw new BadRequestException(
            `Role with ID "${allowedUpdates.role_id}" not found.`,
          );
        user.role = newRole;
        user.role_id = newRole.role_id;
      }
    }
    Object.assign(user, allowedUpdates);

    const updatedUser = await this.userRepository.save(user);
    const userWithRole = await this.userRepository.findUserWithRole(
      updatedUser.auth0_id,
    );
    if (!userWithRole)
      throw new InternalServerErrorException(
        'Failed to retrieve user after update.',
      );
    return plainToInstance(UserDto, userWithRole);
  }

  async softDeleteUser(auth0_id: string): Promise<void> {
    const user = await this.userRepository.findByAuth0Id(auth0_id, false);
    if (!user) {
      throw new NotFoundException(
        `Active user with ID "${auth0_id}" not found.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateResult = await queryRunner.manager.update(
        User,
        { auth0_id: auth0_id, deleted_at: IsNull() },
        { deleted_at: new Date() },
      );

      if (updateResult.affected === 0) {
        throw new NotFoundException(
          `Active user with ID "${auth0_id}" not found for soft deletion (possibly already deleted).`,
        );
      }

      const adminEntry = await this.adminService.findByUserIdInternal(auth0_id);
      if (adminEntry) {
        await this.adminService.removeAdminPermissionsByUserIdInternal(
          auth0_id,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error during soft delete transaction:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        'Could not deactivate user due to an internal error.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async reactivateUser(auth0_id: string): Promise<UserDto> {
    const user = await this.userRepository.findByAuth0Id(auth0_id, true);
    if (!user) {
      throw new NotFoundException(`User with ID "${auth0_id}" not found.`);
    }
    if (!user.deleted_at) {
      throw new BadRequestException(
        `User with ID "${auth0_id}" is already active.`,
      );
    }

    user.deleted_at = null;

    const reactivatedUser = await this.userRepository.save(user);
    const userWithRole = await this.userRepository.findUserWithRole(
      reactivatedUser.auth0_id,
    );
    if (!userWithRole)
      throw new InternalServerErrorException(
        'Failed to retrieve user after reactivation.',
      );
    return plainToInstance(UserDto, userWithRole);
  }
}
