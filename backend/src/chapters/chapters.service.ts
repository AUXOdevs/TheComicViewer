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

    // Convertir release_date de string a Date si existe
    const chapterToCreate: Partial<Chapter> = {
      ...createChapterDto,
      release_date: createChapterDto.release_date
        ? new Date(createChapterDto.release_date)
        : null,
    };
    // Convertir array de URLs a string JSON para la base de datos
    chapterToCreate.pages = JSON.stringify(createChapterDto.pages) as any;

    const newChapter = this.chapterRepository.create(chapterToCreate);
    const savedChapter = await this.chapterRepository.save(newChapter);
    this.logger.log(
      `create(): Capítulo "${savedChapter.name}" (Título: ${title.name}) creado con ID: ${savedChapter.chapter_id}`,
    );

    // Al retornar, asegúrate de que 'pages' sea un array de strings para el DTO
    const chapterDto = plainToInstance(ChapterDto, savedChapter);
    chapterDto.pages = JSON.parse(savedChapter.pages as any);
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
    return plainToInstance(ChapterDto, chapters).map((chapter) => {
      if (typeof chapter.pages === 'string') {
        chapter.pages = JSON.parse(chapter.pages as any);
      }
      return chapter;
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
    const chapter = await this.chapterRepository.findOneById(id);
    if (!chapter) {
      this.logger.warn(`findOne(): Capítulo con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Chapter with ID "${id}" not found.`);
    }

    let pagesArray: string[];
    try {
      pagesArray = JSON.parse(chapter.pages as any);
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
      chapter.pages = pagesArray as any;
    } else {
      this.logger.log(
        `findOne(): Acceso completo a capítulo ${chapter.chapter_number} para usuario suscrito/admin.`,
      );
      chapter.pages = pagesArray as any;
    }

    const chapterDto = plainToInstance(ChapterDto, chapter);
    chapterDto.pages = chapter.pages as string[];
    return chapterDto;
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

    // Extraer title_id, pages, release_date para manejar por separado
    // Usamos 'as any' para permitir la desestructuración de propiedades que TypeScript no ve directamente
    const { title_id, pages, release_date, ...restOfUpdateDto } =
      updateChapterDto as any; // <-- CORRECCIÓN APLICADA AQUÍ

    // Validar y actualizar title_id si se proporciona
    if (title_id !== undefined) {
      const title = await this.titleRepository.findOneById(title_id);
      if (!title) {
        throw new NotFoundException(`Title with ID "${title_id}" not found.`);
      }
      chapter.title_id = title_id; // Asignar al entity
    }

    // Convertir release_date de string a Date si se actualiza
    if (release_date !== undefined) {
      chapter.release_date = release_date ? new Date(release_date) : null;
    }

    // Manejar 'pages' si se actualiza
    if (pages) {
      chapter.pages = JSON.stringify(pages) as any; // Convertir a string para la DB
    }

    // Aplicar las demás propiedades del DTO
    Object.assign(chapter, restOfUpdateDto);
    const updatedChapter = await this.chapterRepository.save(chapter);
    this.logger.log(
      `update(): Capítulo "${updatedChapter.name}" (ID: ${updatedChapter.chapter_id}) actualizado exitosamente.`,
    );

    const chapterDto = plainToInstance(ChapterDto, updatedChapter);
    chapterDto.pages = JSON.parse(updatedChapter.pages as any); // Convertir de nuevo a array para el DTO
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
