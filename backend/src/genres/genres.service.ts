import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { GenreDto } from './dto/genre.dto';
import { plainToInstance } from 'class-transformer';
import { Genre } from './entities/genre.entity';
import { GenreRepository } from './genres.repository';

@Injectable()
export class GenresService {
  private readonly logger = new Logger(GenresService.name);

  constructor(private readonly genreRepository: GenreRepository) {}

  async create(createGenreDto: CreateGenreDto): Promise<GenreDto> {
    this.logger.debug('create(): Creando nuevo género.');
    const existingGenre = await this.genreRepository.findByName(
      createGenreDto.name,
    );
    if (existingGenre) {
      throw new ConflictException(
        `Genre "${createGenreDto.name}" already exists.`,
      );
    }
    const newGenre = this.genreRepository.create(createGenreDto);
    const savedGenre = await this.genreRepository.save(newGenre);
    this.logger.log(
      `create(): Género "${savedGenre.name}" creado con ID: ${savedGenre.genre_id}`,
    );
    return plainToInstance(GenreDto, savedGenre);
  }

  async findAll(): Promise<GenreDto[]> {
    this.logger.debug('findAll(): Buscando todos los géneros.');
    const genres = await this.genreRepository.findAll();
    return plainToInstance(GenreDto, genres);
  }

  async findOne(id: string): Promise<GenreDto> {
    this.logger.debug(`findOne(): Buscando género con ID: ${id}`);
    const genre = await this.genreRepository.findOneById(id);
    if (!genre) {
      this.logger.warn(`findOne(): Género con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Genre with ID "${id}" not found.`);
    }
    return plainToInstance(GenreDto, genre);
  }

  async update(id: string, updateGenreDto: UpdateGenreDto): Promise<GenreDto> {
    this.logger.debug(`update(): Actualizando género con ID: ${id}`);
    const genre = await this.genreRepository.findOneById(id);
    if (!genre) {
      this.logger.warn(
        `update(): Género con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Genre with ID "${id}" not found.`);
    }

    if (updateGenreDto.name && updateGenreDto.name !== genre.name) {
      const existing = await this.genreRepository.findByName(
        updateGenreDto.name,
      );
      if (existing && existing.genre_id !== id) {
        throw new ConflictException(
          `Genre "${updateGenreDto.name}" already exists.`,
        );
      }
    }

    Object.assign(genre, updateGenreDto);
    const updatedGenre = await this.genreRepository.save(genre);
    this.logger.log(
      `update(): Género "${updatedGenre.name}" (ID: ${updatedGenre.genre_id}) actualizado exitosamente.`,
    );
    return plainToInstance(GenreDto, updatedGenre);
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`remove(): Eliminando género con ID: ${id}`);
    const genre = await this.genreRepository.findOneById(id);
    if (!genre) {
      this.logger.warn(
        `remove(): Género con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Genre with ID "${id}" not found.`);
    }
    await this.genreRepository.delete(id);
    this.logger.log(`remove(): Género con ID "${id}" eliminado exitosamente.`);
  }
}
