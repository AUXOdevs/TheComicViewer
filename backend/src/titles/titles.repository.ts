// src/titles/titles.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository, DeleteResult } from 'typeorm';
import { Title } from './entities/title.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderDto } from 'src/common/dto/order.dto';

@Injectable()
export class TitleRepository extends Repository<Title> {
  private readonly logger = new Logger(TitleRepository.name);

  constructor(private dataSource: DataSource) {
    super(Title, dataSource.createEntityManager());
  }

  // Método para encontrar un título por su ID, con relaciones
  async findOneById(title_id: string): Promise<Title | null> {
    this.logger.debug(`findOneById(): Buscando título con ID: ${title_id}`);
    return (
      this.createQueryBuilder('title')
        .leftJoinAndSelect('title.chapters', 'chapters')
        // Puedes añadir más relaciones si las necesitas por defecto al buscar un solo título
        .where('title.title_id = :title_id', { title_id })
        .getOne()
    );
  }

  // Método para encontrar un título por su nombre (para validación de unicidad o búsqueda exacta)
  async findByName(name: string): Promise<Title | null> {
    this.logger.debug(`findByName(): Buscando título con nombre: ${name}`);
    // Usamos LOWER para búsqueda insensible a mayúsculas/minúsculas
    return this.createQueryBuilder('title')
      .where('LOWER(title.name) = LOWER(:name)', { name })
      .getOne();
  }

  // Método para encontrar todos los títulos con paginación, ordenación y filtrado por nombre
  async findAllPaginated(
    paginationOptions: PaginationDto,
    orderOptions: OrderDto,
    nameFilter?: string, // Nuevo parámetro para filtrar por nombre
  ): Promise<{ titles: Title[]; total: number }> {
    this.logger.debug(
      `findAllPaginated(): Buscando títulos paginados con filtros: ${JSON.stringify({ paginationOptions, orderOptions, nameFilter })}`,
    );
    const { page, limit } = paginationOptions;
    const { sortBy, order } = orderOptions;

    const queryBuilder = this.createQueryBuilder('title');

    // Aplicar filtro por nombre si está presente
    if (nameFilter) {
      queryBuilder.andWhere('LOWER(title.name) LIKE LOWER(:nameFilter)', {
        nameFilter: `%${nameFilter}%`,
      });
    }

    // Ordenación
    const validSortColumns = {
      created_at: 'title.created_at',
      name: 'title.name',
      publication_date: 'title.publication_date', // Correcto ahora
    };

    const actualSortBy = validSortColumns[sortBy] || 'title.created_at';

    queryBuilder.orderBy(actualSortBy, order);

    const [titles, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { titles, total };
  }

  // No necesitamos definir explícitamente `create` y `save` aquí.
  // Ya se heredan de `Repository<Title>` con las firmas correctas.

  // Método para eliminar un título por ID
  async delete(title_id: string): Promise<DeleteResult> {
    return this.manager.delete(Title, title_id);
  }
}
