import { Repository, IsNull, Not } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderDto } from 'src/common/dto/order.dto';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(User)
    private readonly userORMRepository: Repository<User>,
  ) {}

  private createQueryBuilder(alias = 'user') {
    return this.userORMRepository.createQueryBuilder(alias);
  }

  // Método para encontrar un usuario por Auth0 ID con opción de incluir eliminados
  async findOneByAuth0Id(
    auth0Id: string,
    includeDeleted: boolean = false,
  ): Promise<User | null> {
    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role') // Cargar el rol
      .leftJoinAndSelect('user.admin', 'admin') // Cargar la relación admin
      .where('user.auth0_id = :auth0Id', { auth0Id });

    if (!includeDeleted) {
      query.andWhere('user.deleted_at IS NULL');
    }

    return query.getOne();
  }

  // Método para encontrar un usuario por email (carga el rol y admin para permisos)
  async findByEmail(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.admin', 'admin')
      .where('user.email = :email', { email })
      .getOne();
  }

  // Método para encontrar un usuario por email sin cargar relaciones (para uso interno rápido)
  // Útil para verificaciones de unicidad de email sin sobrecarga de datos.
  async findByEmailSimple(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
  }

  // MODIFICADO: Reintroducido para que el servicio pueda crear una instancia de User
  create(userPartial: Partial<User>): User {
    return this.userORMRepository.create(userPartial);
  }

  // Método para encontrar todos los usuarios con paginación, ordenación y filtrado
  async findAllPaginated(
    paginationOptions: PaginationDto,
    orderOptions: OrderDto,
    includeDeleted: boolean = false,
    filterAuth0Id?: string,
    filterEmail?: string,
    filterRoleName?: string,
    filterIsBlocked?: boolean,
  ): Promise<{ users: User[]; total: number }> {
    const { page, limit } = paginationOptions;
    const { sortBy, order } = orderOptions;

    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role') // Siempre cargar el rol para la respuesta del DTO
      .leftJoinAndSelect('user.admin', 'admin'); // Cargar la relación admin

    if (filterAuth0Id) {
      query.andWhere('user.auth0_id = :filterAuth0Id', { filterAuth0Id });
    }
    if (filterEmail) {
      query.andWhere('user.email ILIKE :filterEmail', {
        filterEmail: `%${filterEmail}%`,
      }); // Búsqueda parcial case-insensitive
    }
    if (filterRoleName) {
      query.andWhere('role.name = :filterRoleName', { filterRoleName });
    }
    if (filterIsBlocked !== undefined) {
      query.andWhere('user.is_blocked = :filterIsBlocked', { filterIsBlocked });
    }

    if (!includeDeleted) {
      query.andWhere('user.deleted_at IS NULL');
    } else {
      // Si includeDeleted es true, no aplicar filtro de deleted_at
      // pero si queremos ver SOLO los eliminados, el filtro is_blocked puede ser false
      // y filterRoleName puede ser un rol específico
    }

    // Ordenación
    // Asegurarse de que sortBy es un campo válido para evitar inyección SQL
    // Se mapean los nombres de las propiedades de la entidad a los nombres de las columnas o rutas de relación.
    const validSortColumns = {
      created_at: 'user.created_at',
      last_login: 'user.last_login',
      name: 'user.name',
      email: 'user.email',
      role: 'role.name', // Ordenar por el nombre del rol
      is_blocked: 'user.is_blocked',
      // Añade más columnas si necesitas ordenar por ellas
    };

    const actualSortBy = validSortColumns[sortBy] || 'user.created_at'; // Fallback por defecto

    query.orderBy(actualSortBy, order);

    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  // Método para encontrar usuarios desactivados (soft-deleted)
  // Mantenemos este, aunque findAllPaginated puede hacerlo con filterIsBlocked
  // Es útil como un endpoint específico y claro para esta necesidad.
  async findDeactivatedUsers(): Promise<User[]> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.admin', 'admin')
      .where('user.deleted_at IS NOT NULL')
      .getMany();
  }

  async save(user: User): Promise<User> {
    return this.userORMRepository.save(user);
  }

  async update(auth0Id: string, partialEntity: Partial<User>): Promise<any> {
    return this.userORMRepository.update({ auth0_id: auth0Id }, partialEntity);
  }

  async softDelete(auth0Id: string): Promise<void> {
    await this.userORMRepository.update(
      { auth0_id: auth0Id },
      { deleted_at: new Date() },
    );
  }

  async reactivate(auth0Id: string): Promise<void> {
    await this.userORMRepository.update(
      { auth0_id: auth0Id },
      { deleted_at: null },
    );
  }
}
