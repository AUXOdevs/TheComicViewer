// src/user/user.repository.ts
import {
  Repository,
  SaveOptions,
  IsNull,
  Not,
  UpdateResult,
  DataSource,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userORMRepository: Repository<User>,
  ) {}

  private createQueryBuilder(alias = 'user') {
    return this.userORMRepository.createQueryBuilder(alias);
  }

  // --- Métodos de Lectura (Read Operations) ---

  async findByAuth0Id(
    auth0Id: string,
    includeDeleted = false,
  ): Promise<User | null> {
    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.auth0_id = :auth0Id', { auth0Id });

    if (!includeDeleted) {
      query.andWhere('user.deleted_at IS NULL');
    }
    return query.getOne();
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<User | null> {
    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email });

    if (!includeDeleted) {
      query.andWhere('user.deleted_at IS NULL');
    }
    return query.getOne();
  }

  async findUserWithRole(
    auth0Id: string,
    includeDeleted = false,
  ): Promise<User | null> {
    return this.findByAuth0Id(auth0Id, includeDeleted);
  }

  async findAll(includeDeleted = false): Promise<User[]> {
    const query = this.createQueryBuilder('user').leftJoinAndSelect(
      'user.role',
      'role',
    );

    if (!includeDeleted) {
      query.andWhere('user.deleted_at IS NULL');
    }
    return query.getMany();
  }

  // Nuevo método para encontrar solo usuarios desactivados
  async findDeactivatedUsers(): Promise<User[]> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deleted_at IS NOT NULL') // Filtra por usuarios con deleted_at no nulo
      .getMany();
  }

  async findOne(options: any, includeDeleted = false): Promise<User | null> {
    const whereClause = { ...options.where };
    if (!includeDeleted) {
      whereClause.deleted_at = IsNull();
    }
    return this.userORMRepository.findOne({
      ...options,
      where: whereClause,
      relations: ['role'],
    });
  }

  // --- Métodos de Escritura (Write Operations) ---

  create(userPartial: Partial<User>): User {
    return this.userORMRepository.create(userPartial);
  }

  async save(user: User, options?: SaveOptions): Promise<User>;
  async save(users: User[], options?: SaveOptions): Promise<User[]>;
  async save(
    userOrUsers: User | User[],
    options?: SaveOptions,
  ): Promise<User | User[]> {
    return this.userORMRepository.save(userOrUsers as any, options);
  }

  async markAsDeleted(auth0_id: string): Promise<UpdateResult> {
    return this.userORMRepository.update(
      { auth0_id, deleted_at: IsNull() },
      { deleted_at: new Date() },
    );
  }

  async markAsActive(auth0_id: string): Promise<UpdateResult> {
    return this.userORMRepository.update(
      { auth0_id, deleted_at: Not(IsNull()) },
      { deleted_at: null },
    );
  }
}
