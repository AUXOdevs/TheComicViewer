// src/titles/titles.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { TitleRepository } from './titles.repository';
import { CreateTitleDto } from './dto/create-title.dto';
import { UpdateTitleDto } from './dto/update-title.dto';
import { Title } from './entities/title.entity';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { GetAllTitlesDto, OrderDirection } from './dto/get-all-titles.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TitlesService {
  private readonly logger = new Logger(TitlesService.name);

  constructor(
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async create(createTitleDto: CreateTitleDto): Promise<Title> {
    this.logger.debug(
      `create(): Intentando crear título: ${createTitleDto.name}`,
    );

    const existingTitle = await this.titleRepository.findByName(
      createTitleDto.name,
    );
    if (existingTitle) {
      this.logger.warn(
        `create(): Conflicto: Título con nombre "${createTitleDto.name}" ya existe.`,
      );
      throw new ConflictException(
        `Title with name "${createTitleDto.name}" already exists.`,
      );
    }

    try {
      // Corrección TS2345: Convertir publication_date de string a Date antes de crear la entidad
      const titleToCreate: Partial<Title> = {
        ...createTitleDto,
        publication_date: createTitleDto.publication_date
          ? new Date(createTitleDto.publication_date)
          : null,
      };

      // Pasar el objeto ya transformado a `create`
      const newTitle = this.titleRepository.create(titleToCreate);
      const savedTitle = await this.titleRepository.save(newTitle);
      this.logger.log(
        `create(): Título "${savedTitle.name}" (ID: ${savedTitle.title_id}) creado exitosamente.`,
      );
      return savedTitle;
    } catch (error) {
      this.logger.error(
        `create(): Error al guardar título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create title.');
    }
  }

  async findAll(
    queryParams: GetAllTitlesDto,
  ): Promise<{ titles: Title[]; total: number }> {
    this.logger.debug(
      `findAll(): Buscando títulos con queryParams: ${JSON.stringify(queryParams)}`,
    );
    const { page, limit, sortBy, order, name } = queryParams;

    const validSortColumns = ['created_at', 'name', 'publication_date']; // Usar publication_date
    if (sortBy && !validSortColumns.includes(sortBy)) {
      this.logger.warn(`findAll(): Parámetro sortBy inválido: ${sortBy}`);
      throw new BadRequestException(
        `Invalid sortBy parameter: ${sortBy}. Allowed values are: ${validSortColumns.join(', ')}`,
      );
    }

    try {
      const { titles, total } = await this.titleRepository.findAllPaginated(
        { page: page || 1, limit: limit || 10 },
        { sortBy: sortBy || 'created_at', order: order || OrderDirection.DESC },
        name,
      );
      this.logger.log(`findAll(): Encontrados ${total} títulos.`);
      return { titles, total };
    } catch (error) {
      this.logger.error(
        `findAll(): Error al obtener títulos: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve titles.');
    }
  }

  async findByName(name: string): Promise<Title> {
    this.logger.debug(`findByName(): Buscando título con nombre: ${name}`);
    const title = await this.titleRepository.findByName(name);
    if (!title) {
      this.logger.warn(
        `findByName(): Título con nombre "${name}" no encontrado.`,
      );
      throw new NotFoundException(`Title with name "${name}" not found.`);
    }
    this.logger.log(
      `findByName(): Título "${title.name}" (ID: ${title.title_id}) encontrado.`,
    );
    return title;
  }

  async findOne(id: string): Promise<Title> {
    this.logger.debug(`findOne(): Buscando título con ID: ${id}`);
    const title = await this.titleRepository.findOneById(id);
    if (!title) {
      this.logger.warn(`findOne(): Título con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Title with ID "${id}" not found.`);
    }
    this.logger.log(
      `findOne(): Título "${title.name}" (ID: ${title.title_id}) encontrado.`,
    );
    return title;
  }

  async update(id: string, updateTitleDto: UpdateTitleDto): Promise<Title> {
    this.logger.debug(`update(): Actualizando título con ID: ${id}`);
    const title = await this.titleRepository.findOneById(id);
    if (!title) {
      this.logger.warn(`update(): Título con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Title with ID "${id}" not found.`);
    }

    if (updateTitleDto.name && updateTitleDto.name !== title.name) {
      const existingTitleByName = await this.titleRepository.findByName(
        updateTitleDto.name,
      );
      if (existingTitleByName && existingTitleByName.title_id !== id) {
        this.logger.warn(
          `update(): Conflicto: Título con nombre "${updateTitleDto.name}" ya existe.`,
        );
        throw new ConflictException(
          `Title with name "${updateTitleDto.name}" already exists.`,
        );
      }
    }

    try {
      // Corrección TS2551 (publication_year -> publication_date)
      // Convertir publication_date de string a Date si se está actualizando y existe en el DTO
      if (updateTitleDto.publication_date !== undefined) {
        title.publication_date = updateTitleDto.publication_date
          ? new Date(updateTitleDto.publication_date)
          : null;
      }

      // Aplicar las demás propiedades del DTO a la entidad
      // Excluimos publication_date si ya la manejamos manualmente para evitar conflictos de tipo.
      const { publication_date, ...restOfUpdateDto } = updateTitleDto;
      Object.assign(title, restOfUpdateDto);

      const updatedTitle = await this.titleRepository.save(title);
      this.logger.log(
        `update(): Título "${updatedTitle.name}" (ID: ${updatedTitle.title_id}) actualizado exitosamente.`,
      );
      return updatedTitle;
    } catch (error) {
      this.logger.error(
        `update(): Error al actualizar título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update title.');
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`remove(): Intentando eliminar título con ID: ${id}`);
    const title = await this.titleRepository.findOneById(id);
    if (!title) {
      this.logger.warn(
        `remove(): Título con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Title with ID "${id}" not found.`);
    }

    // Corrección TS2551 (findByTitleId -> findAllByTitleId)
    const associatedChapters =
      await this.chapterRepository.findAllByTitleId(id);
    if (associatedChapters && associatedChapters.length > 0) {
      this.logger.warn(
        `remove(): Título con ID "${id}" tiene ${associatedChapters.length} capítulos asociados y no puede ser eliminado.`,
      );
      throw new BadRequestException(
        `Title with ID "${id}" has associated chapters and cannot be deleted until its chapters are removed.`,
      );
    }

    try {
      const deleteResult = await this.titleRepository.delete(id);
      if (deleteResult.affected === 0) {
        this.logger.warn(
          `remove(): No se pudo eliminar el título con ID "${id}" (posiblemente no existía o ya eliminado).`,
        );
        throw new NotFoundException(`Title with ID "${id}" not found.`);
      }
      this.logger.log(
        `remove(): Título con ID "${id}" eliminado exitosamente.`,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `remove(): Error al eliminar título: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to remove title.');
    }
  }
}
