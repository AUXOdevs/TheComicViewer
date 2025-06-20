// src/chapters/chapters.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ChapterDto } from './dto/chapter.dto';
import { plainToInstance } from 'class-transformer';
import { Chapter } from './entities/chapter.entity';
import { ChapterRepository } from './chapters.repository';
import { TitleRepository } from '../titles/titles.repository';

@Injectable()
export class ChaptersService {
  private readonly logger = new Logger(ChaptersService.name);

  constructor(
    private readonly chapterRepository: ChapterRepository,
    private readonly titleRepository: TitleRepository,
  ) {}

  async create(createChapterDto: CreateChapterDto): Promise<ChapterDto> {
    this.logger.debug('create(): Creando nuevo capítulo.');
    const title = await this.titleRepository.findOneById(
      createChapterDto.title_id,
    );
    if (!title) {
      throw new NotFoundException(
        `Title with ID "${createChapterDto.title_id}" not found.`,
      );
    }

    const chapterToCreate: Partial<Chapter> = {
      name: createChapterDto.name,
      title_id: createChapterDto.title_id,
      chapter_number: createChapterDto.chapter_number,
      release_date: createChapterDto.release_date
        ? new Date(createChapterDto.release_date)
        : null,
      pages: JSON.stringify(createChapterDto.pages), // 'pages' es un array en DTO, lo stringificamos para la entidad
    };

    const newChapter = this.chapterRepository.create(chapterToCreate);
    const savedChapter = await this.chapterRepository.save(newChapter);
    this.logger.log(
      `create(): Capítulo "${savedChapter.name}" (Título: ${title.name}) creado con ID: ${savedChapter.chapter_id}`,
    );

    const chapterDto = plainToInstance(ChapterDto, savedChapter);
    chapterDto.pages = JSON.parse(savedChapter.pages); // Parseamos para el DTO de salida
    return chapterDto;
  }

  async findAllByTitle(titleId: string): Promise<ChapterDto[]> {
    this.logger.debug(
      `findAllByTitle(): Buscando capítulos para el título con ID: ${titleId}`,
    );
    const chapters = await this.chapterRepository.findAllByTitleId(titleId);
    if (!chapters || chapters.length === 0) {
      this.logger.warn(
        `findAllByTitle(): No se encontraron capítulos para el título con ID "${titleId}".`,
      );
    }
    return chapters.map((chapter) => {
      const chapterDto = plainToInstance(ChapterDto, chapter);
      if (typeof chapter.pages === 'string') {
        chapterDto.pages = JSON.parse(chapter.pages);
      } else {
        chapterDto.pages = [];
      }
      return chapterDto;
    });
  }

  async findOne(
    id: string,
    isAuthenticated: boolean,
    userRole?: string,
  ): Promise<ChapterDto> {
    this.logger.debug(
      `findOne(): Buscando capítulo con ID: ${id}. Autenticado: ${isAuthenticated}, Rol: ${userRole}`,
    );
    // Este findOneById ya carga el título gracias al repositorio
    const chapter = await this.chapterRepository.findOneById(id);
    if (!chapter) {
      this.logger.warn(`findOne(): Capítulo con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Chapter with ID "${id}" not found.`);
    }

    let pagesArray: string[];
    try {
      pagesArray = JSON.parse(chapter.pages);
    } catch (e) {
      this.logger.error(
        `findOne(): Error al parsear páginas del capítulo ${id}:`,
        e,
      );
      throw new InternalServerErrorException(
        'Failed to process chapter pages.',
      );
    }

    const isSubscribed =
      isAuthenticated && (userRole === 'Suscrito' || userRole === 'admin');

    if (!isSubscribed) {
      if (chapter.chapter_number > 2) {
        this.logger.warn(
          `findOne(): Acceso denegado a capítulo ${chapter.chapter_number} para usuario no suscrito.`,
        );
        throw new BadRequestException(
          'Access to this chapter is limited. Please subscribe for full access.',
        );
      }
      this.logger.log(
        `findOne(): Acceso a capítulo ${chapter.chapter_number} (gratis) concedido para usuario no suscrito.`,
      );
    } else {
      this.logger.log(
        `findOne(): Acceso completo a capítulo ${chapter.chapter_number} para usuario suscrito/admin.`,
      );
    }

    const chapterDto = plainToInstance(ChapterDto, chapter);
    chapterDto.pages = pagesArray;
    return chapterDto;
  }

  // Se remueve findOneByIdWithTitle aquí ya que el findOneById del repositorio ya lo hace.
  // Pero si necesitas exponerlo como parte de tu API de servicio, podrías crear un alias o re-exportar.
  // Para el FavoritesService, el findOneById del ChapterRepository es suficiente.

  async findByTitle(titleId: string): Promise<ChapterDto[]> {
    this.logger.debug(
      `findByTitle(): Buscando capítulos para título con ID: ${titleId}`,
    );
    const chapters = await this.chapterRepository.findAllByTitleId(titleId);
    if (!chapters || chapters.length === 0) {
      throw new NotFoundException(
        `No se encontraron capítulos para el título con ID ${titleId}.`,
      );
    }
    return plainToInstance(ChapterDto, chapters);
  }

  async update(
    id: string,
    updateChapterDto: UpdateChapterDto,
  ): Promise<ChapterDto> {
    this.logger.debug(`update(): Actualizando capítulo con ID: ${id}`);
    const chapter = await this.chapterRepository.findOneById(id);
    if (!chapter) {
      this.logger.warn(
        `update(): Capítulo con ID "${id}" no encontrado para actualizar.`,
      );
      throw new NotFoundException(`Chapter with ID "${id}" not found.`);
    }

    const { title_id, pages, release_date, ...restOfUpdateDto } =
      updateChapterDto;

    if (title_id !== undefined) {
      const title = await this.titleRepository.findOneById(title_id);
      if (!title) {
        throw new NotFoundException(`Title with ID "${title_id}" not found.`);
      }
      chapter.title_id = title_id;
    }

    if (release_date !== undefined) {
      chapter.release_date = release_date ? new Date(release_date) : null;
    }

    if (pages !== undefined) {
      chapter.pages = JSON.stringify(pages);
    }

    Object.assign(chapter, restOfUpdateDto);

    const updatedChapter = await this.chapterRepository.save(chapter);
    this.logger.log(
      `update(): Capítulo "${updatedChapter.name}" (ID: ${updatedChapter.chapter_id}) actualizado exitosamente.`,
    );

    const chapterDto = plainToInstance(ChapterDto, updatedChapter);
    chapterDto.pages = JSON.parse(updatedChapter.pages);
    return chapterDto;
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`remove(): Eliminando capítulo con ID: ${id}`);
    const chapter = await this.chapterRepository.findOneById(id);
    if (!chapter) {
      this.logger.warn(
        `remove(): Capítulo con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(`Chapter with ID "${id}" not found.`);
    }
    await this.chapterRepository.delete(id);
    this.logger.log(
      `remove(): Capítulo con ID "${id}" eliminado exitosamente.`,
    );
  }
}
