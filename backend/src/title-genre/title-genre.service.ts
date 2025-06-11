import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateTitleGenreDto } from './dto/create-title-genre.dto';
import { TitleGenreDto } from './dto/title-genre.dto';
import { plainToInstance } from 'class-transformer';
import { TitleGenreRepository } from './title-genre.repository';
import { TitleRepository } from 'src/titles/titles.repository';
import { GenreRepository } from 'src/genres/genres.repository';

@Injectable()
export class TitleGenreService {
  private readonly logger = new Logger(TitleGenreService.name);

  constructor(
    private readonly titleGenreRepository: TitleGenreRepository,
    private readonly titleRepository: TitleRepository,
    private readonly genreRepository: GenreRepository,
  ) {}

  async create(
    createTitleGenreDto: CreateTitleGenreDto,
  ): Promise<TitleGenreDto> {
    this.logger.debug('create(): Creando asociación título-género.');
    const { title_id, genre_id } = createTitleGenreDto;

    const title = await this.titleRepository.findOneById(title_id);
    if (!title) {
      throw new NotFoundException(`Title with ID "${title_id}" not found.`);
    }
    const genre = await this.genreRepository.findOneById(genre_id); // <-- CAMBIO CLAVE: findOneById
    if (!genre) {
      throw new NotFoundException(`Genre with ID "${genre_id}" not found.`);
    }

    const existingAssociation =
      await this.titleGenreRepository.findOneByTitleAndGenre(
        title_id,
        genre_id,
      );
    if (existingAssociation) {
      throw new ConflictException(
        `Title "${title.name}" is already associated with genre "${genre.name}".`,
      );
    }

    const newAssociation = this.titleGenreRepository.create({
      title_id,
      genre_id,
    });
    const savedAssociation =
      await this.titleGenreRepository.save(newAssociation);
    this.logger.log(
      `create(): Asociación título-género (ID: ${savedAssociation.title_genre_id}) creada entre Título "${title.name}" y Género "${genre.name}".`,
    );
    return plainToInstance(TitleGenreDto, savedAssociation);
  }

  async findAllByTitle(titleId: string): Promise<TitleGenreDto[]> {
    this.logger.debug(
      `findAllByTitle(): Buscando asociaciones de género para título con ID: ${titleId}.`,
    );
    const title = await this.titleRepository.findOneById(titleId);
    if (!title) {
      throw new NotFoundException(`Title with ID "${titleId}" not found.`);
    }
    const associations = await this.titleGenreRepository.findByTitleId(titleId);
    return plainToInstance(TitleGenreDto, associations);
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(
      `remove(): Eliminando asociación título-género con ID: ${id}`,
    );
    const association = await this.titleGenreRepository.findOneById(id); // <-- CAMBIO CLAVE: findOneById
    if (!association) {
      this.logger.warn(
        `remove(): Asociación título-género con ID "${id}" no encontrada para eliminar.`,
      );
      throw new NotFoundException(
        `Title-Genre association with ID "${id}" not found.`,
      );
    }
    await this.titleGenreRepository.delete(id);
    this.logger.log(
      `remove(): Asociación título-género con ID "${id}" eliminada exitosamente.`,
    );
  }
}
