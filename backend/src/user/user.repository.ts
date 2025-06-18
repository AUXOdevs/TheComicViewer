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
      .leftJoinAndSelect('user.admin', 'admin') // <-- IMPORTANTE: Cargar la relación 'admin'
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
      .leftJoinAndSelect('user.admin', 'admin') // <-- IMPORTANTE: Cargar la relación 'admin'
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
    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.admin', 'admin'); // <-- IMPORTANTE: Cargar la relación 'admin'

    if (!includeDeleted) {
      query.andWhere('user.deleted_at IS NULL');
    }
    return query.getMany();
  }

  async findDeactivatedUsers(): Promise<User[]> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.admin', 'admin') // <-- IMPORTANTE: Cargar la relación 'admin'
      .where('user.deleted_at IS NOT NULL')
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
      relations: ['role', 'admin'], // <-- Asegurar que ambas relaciones se cargan
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

  // ************ NUEVO MÉTODO DE ACTUALIZACIÓN ************
  async updateUserFields(
    auth0Id: string,
    partialUser: Partial<User>,
  ): Promise<UpdateResult> {
    // Este método usa `update` directamente para evitar problemas con la clave primaria
    // al actualizar otros campos.
    return this.userORMRepository.update({ auth0_id: auth0Id }, partialUser);
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
