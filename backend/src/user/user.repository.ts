// src/user/user.repository.ts
import { Repository, SaveOptions, RemoveOptions } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userORMRepository: Repository<User>,
  ) {}

  // --- Métodos de Lectura (Read Operations) ---

  async findByAuth0Id(auth0Id: string): Promise<User | undefined> {
    return this.userORMRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.auth0_id = :auth0Id', { auth0Id }) // <-- USAR auth0_id
      .getOne();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userORMRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findUserWithRole(auth0Id: string): Promise<User | undefined> {
    // <-- CAMBIO DE PARÁMETRO
    return this.userORMRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.auth0_id = :auth0Id', { auth0Id }) // <-- USAR auth0_id
      .getOne();
  }

  async find(options?: any): Promise<User[]> {
    const query = this.userORMRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');
    // ... (resto de la lógica de find si tienes filtros o paginación)
    return query.getMany();
  }

  async findOne(options?: any): Promise<User | undefined> {
    // Este findOne sigue siendo útil para buscar por cualquier columna sin relaciones
    // Si lo llamas con { where: { auth0_id: '...' } }, debería funcionar
    return this.userORMRepository.findOne(options);
  }

  // --- Métodos de Escritura (Write Operations) ---

  create(userPartial: Partial<User>): User {
    return this.userORMRepository.create(userPartial);
  }

  async save(user: User): Promise<User>;
  async save(users: User[]): Promise<User[]>;
  async save(
    userOrUsers: User | User[],
    options?: SaveOptions,
  ): Promise<User | User[]> {
    return this.userORMRepository.save(userOrUsers as any, options);
  }

  async remove(user: User): Promise<User>;
  async remove(users: User[]): Promise<User[]>;
  async remove(
    userOrUsers: User | User[],
    options?: RemoveOptions,
  ): Promise<User | User[]> {
    return this.userORMRepository.remove(userOrUsers as any, options);
  }
}
