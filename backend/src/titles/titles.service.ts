import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateTitleDto } from './dto/create-title.dto';
import { UpdateTitleDto } from './dto/update-title.dto';
import { TitleDto } from './dto/title.dto';
import { plainToInstance } from 'class-transformer';
import { Title } from './entities/title.entity';
import { ChapterRepository } from 'src/chapters/chapters.repository';
import { TitleRepository } from './titles.repository';

@Injectable()
export class TitlesService {
  private readonly logger = new Logger(TitlesService.name);

  constructor(
    private readonly titleRepository: TitleRepository,
    private readonly chapterRepository: ChapterRepository,
  ) {}

  async create(createTitleDto: CreateTitleDto): Promise<TitleDto> {
    this.logger.debug('create(): Creando nuevo título.');

    // Crear un objeto intermedio para la entidad con el tipo Date correcto
    const titleToCreate: Partial<Title> = {
      ...createTitleDto,
      publication_date: createTitleDto.publication_date
        ? new Date(createTitleDto.publication_date)
        : null,
    };

    const newTitle = this.titleRepository.create(titleToCreate);
    const savedTitle = await this.titleRepository.save(newTitle);
    this.logger.log(
      `create(): Título "${savedTitle.name}" creado con ID: ${savedTitle.title_id}`,
    );
    return plainToInstance(TitleDto, savedTitle);
  }

  async findAll(): Promise<TitleDto[]> {
    this.logger.debug('findAll(): Buscando todos los títulos.');
    const titles = await this.titleRepository.findAll();
    return plainToInstance(TitleDto, titles);
  }

  async findOne(id: string): Promise<TitleDto> {
    this.logger.debug(`findOne(): Buscando título con ID: ${id}`);
    const title = await this.titleRepository.findOneById(id);
    if (!title) {
      this.logger.warn(`findOne(): Título con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Title with ID "${id}" not found.`);
    }
    return plainToInstance(TitleDto, title);
  }

  async update(id: string, updateTitleDto: UpdateTitleDto): Promise<TitleDto> {
    this.logger.debug(`update(): Actualizando título con ID: ${id}`);
    const title = await this.titleRepository.findOneById(id);
    if (!title) {
      this.logger.warn(
        `update(): Título con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Title with ID "${id}" not found.`);
    }

    // Convertir publication_date de string a Date si se está actualizando y existe en el DTO
    if (updateTitleDto.publication_date !== undefined) {
      title.publication_date = updateTitleDto.publication_date
        ? new Date(updateTitleDto.publication_date)
        : null;
    }

    // Aplicar las demás propiedades del DTO (sin incluir publication_date, ya se manejó)
    // Se excluye publication_date explícitamente de Object.assign para evitar sobrescribir con el string si existe
    const { publication_date, ...restOfUpdateDto } = updateTitleDto;
    Object.assign(title, restOfUpdateDto);

    const updatedTitle = await this.titleRepository.save(title);
    this.logger.log(
      `update(): Título "${updatedTitle.name}" (ID: ${updatedTitle.title_id}) actualizado exitosamente.`,
    );
    return plainToInstance(TitleDto, updatedTitle);
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`remove(): Eliminando título con ID: ${id}`);
    const title = await this.titleRepository.findOneById(id);
    if (!title) {
      this.logger.warn(
        `remove(): Título con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Title with ID "${id}" not found.`);
    }
    await this.titleRepository.delete(id);
    this.logger.log(`remove(): Título con ID "${id}" eliminado exitosamente.`);
  }
}
