// src/chapters/chapters.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
import { GetAllChaptersDto, OrderDirection } from './dto/get-all-chapters.dto';

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
      this.logger.warn(
        `create(): Título con ID "${createChapterDto.title_id}" no encontrado.`,
      );
      throw new NotFoundException(
        `Título con ID "${createChapterDto.title_id}" no encontrado.`,
      );
    }

    const existingChapter =
      await this.chapterRepository.findByTitleIdAndChapterNumber(
        createChapterDto.title_id,
        createChapterDto.chapter_number,
      );
    if (existingChapter) {
      this.logger.warn(
        `create(): Ya existe un capítulo con el número "${createChapterDto.chapter_number}" para el título "${title.name}".`,
      );
      throw new ConflictException(
        `Ya existe un capítulo con el número "${createChapterDto.chapter_number}" para este título.`,
      );
    }

    try {
      const chapterToCreate: Partial<Chapter> = {
        name: createChapterDto.name,
        title_id: createChapterDto.title_id,
        chapter_number: createChapterDto.chapter_number,
        release_date: createChapterDto.release_date
          ? new Date(createChapterDto.release_date)
          : null,
        // CLAVE: Asignar al nombre de la columna real de la DB: content_url
        pages: JSON.stringify(createChapterDto.pages), // DTO.pages se convierte a JSON string para DB.content_url
      };

      const newChapter = this.chapterRepository.create(chapterToCreate);
      const savedChapter = await this.chapterRepository.save(newChapter);
      this.logger.log(
        `create(): Capítulo "${savedChapter.name}" (Título: ${title.name}) creado con ID: ${savedChapter.chapter_id}`,
      );

      const chapterDto = plainToInstance(ChapterDto, savedChapter);
      // CLAVE: Parsear content_url desde la entidad para llenar DTO.pages
      if (savedChapter.pages) {
        // savedChapter.pages en entidad es en realidad savedChapter.content_url
        chapterDto.pages = JSON.parse(savedChapter.pages);
      } else {
        chapterDto.pages = []; // Asegurarse de que sea un array vacío si no hay páginas
      }
      return chapterDto;
    } catch (error) {
      this.logger.error(
        `create(): Error al guardar capítulo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al crear el capítulo.',
      );
    }
  }

  async findAll(
    queryParams: GetAllChaptersDto,
  ): Promise<{ chapters: ChapterDto[]; total: number }> {
    this.logger.debug(
      `findAll(): Buscando capítulos con parámetros de consulta: ${JSON.stringify(queryParams)}`,
    );
    const {
      page,
      limit,
      sortBy,
      order,
      name,
      chapterNumber,
      titleId,
      titleName,
    } = queryParams;

    const validSortColumns = [
      'created_at',
      'name',
      'chapter_number',
      'release_date',
    ];
    if (sortBy && !validSortColumns.includes(sortBy)) {
      this.logger.warn(
        `findAll(): Parámetro de ordenación inválido: ${sortBy}`,
      );
      throw new BadRequestException(
        `Parámetro de ordenación inválido: "${sortBy}". Los valores permitidos son: ${validSortColumns.join(', ')}.`,
      );
    }

    try {
      const { chapters, total } = await this.chapterRepository.findAllPaginated(
        { page: page || 1, limit: limit || 10 },
        { sortBy: sortBy || 'created_at', order: order || OrderDirection.DESC },
        name,
        chapterNumber,
        titleId,
        titleName,
      );

      const chaptersWithParsedPages: ChapterDto[] = chapters.map((chapter) => {
        const chapterDto = plainToInstance(ChapterDto, chapter);
        // CLAVE: Parsear content_url desde la entidad para llenar DTO.pages
        if (typeof chapter.pages === 'string') {
          // chapter.pages en entidad es en realidad chapter.content_url
          chapterDto.pages = JSON.parse(chapter.pages);
        } else {
          chapterDto.pages = [];
        }
        return chapterDto;
      });

      this.logger.log(`findAll(): Encontrados ${total} capítulos.`);
      return { chapters: chaptersWithParsedPages, total };
    } catch (error) {
      this.logger.error(
        `findAll(): Error al obtener capítulos: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al obtener la lista de capítulos.',
      );
    }
  }

  async findByName(name: string): Promise<ChapterDto[]> {
    this.logger.debug(`findByName(): Buscando capítulos con nombre: ${name}`);
    const chapters = await this.chapterRepository.findByName(name);
    if (!chapters || chapters.length === 0) {
      this.logger.warn(
        `findByName(): No se encontraron capítulos con el nombre "${name}".`,
      );
      throw new NotFoundException(
        `No se encontraron capítulos con el nombre "${name}".`,
      );
    }
    return chapters.map((chapter) => {
      const chapterDto = plainToInstance(ChapterDto, chapter);
      // CLAVE: Parsear content_url desde la entidad para llenar DTO.pages
      if (typeof chapter.pages === 'string') {
        // chapter.pages en entidad es en realidad chapter.content_url
        chapterDto.pages = JSON.parse(chapter.pages);
      } else {
        chapterDto.pages = [];
      }
      return chapterDto;
    });
  }

  async findAllByTitleName(titleName: string): Promise<ChapterDto[]> {
    this.logger.debug(
      `findAllByTitleName(): Buscando capítulos para el título con nombre: ${titleName}`,
    );
    const chapters = await this.chapterRepository.findAllByTitleName(titleName);
    if (!chapters || chapters.length === 0) {
      this.logger.warn(
        `findAllByTitleName(): Título con nombre "${titleName}" no encontrado o sin capítulos.`,
      );
      throw new NotFoundException(
        `Título con nombre "${titleName}" no encontrado o sin capítulos.`,
      );
    }
    return chapters.map((chapter) => {
      const chapterDto = plainToInstance(ChapterDto, chapter);
      // CLAVE: Parsear content_url desde la entidad para llenar DTO.pages
      if (typeof chapter.pages === 'string') {
        // chapter.pages en entidad es en realidad chapter.content_url
        chapterDto.pages = JSON.parse(chapter.pages);
      } else {
        chapterDto.pages = [];
      }
      return chapterDto;
    });
  }

  async findAllByTitleId(titleId: string): Promise<ChapterDto[]> {
    this.logger.debug(
      `findAllByTitleId(): Buscando capítulos para el título con ID: ${titleId}`,
    );
    const chapters = await this.chapterRepository.findAllByTitleId(titleId);
    if (!chapters || chapters.length === 0) {
      this.logger.warn(
        `findAllByTitleId(): Título con ID "${titleId}" no encontrado o sin capítulos.`,
      );
      throw new NotFoundException(
        `Título con ID "${titleId}" no encontrado o sin capítulos.`,
      );
    }
    return chapters.map((chapter) => {
      const chapterDto = plainToInstance(ChapterDto, chapter);
      // CLAVE: Parsear content_url desde la entidad para llenar DTO.pages
      if (typeof chapter.pages === 'string') {
        // chapter.pages en entidad es en realidad chapter.content_url
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
    const chapter = await this.chapterRepository.findOneById(id);
    if (!chapter) {
      this.logger.warn(`findOne(): Capítulo con ID "${id}" no encontrado.`);
      throw new NotFoundException(`Capítulo con ID "${id}" no encontrado.`);
    }

    let pagesArray: string[];
    try {
      // CLAVE: Parsear content_url de la entidad
      pagesArray = JSON.parse(chapter.pages); // chapter.pages en entidad es en realidad chapter.content_url
    } catch (e) {
      this.logger.error(
        `findOne(): Error al parsear páginas (content_url) del capítulo ${id}:`,
        e,
      );
      throw new InternalServerErrorException(
        'Error al procesar las páginas del capítulo.',
      );
    }

    const isSubscribed =
      isAuthenticated &&
      (userRole === 'Suscrito' ||
        userRole === 'admin' ||
        userRole === 'superadmin');

    if (!isSubscribed) {
      if (chapter.chapter_number > 2) {
        this.logger.warn(
          `findOne(): Acceso denegado al capítulo ${chapter.chapter_number} para usuario no suscrito.`,
        );
        throw new BadRequestException(
          'El acceso a este capítulo está limitado. Por favor, suscríbase para acceso completo.',
        );
      }
      this.logger.log(
        `findOne(): Acceso al capítulo ${chapter.chapter_number} (gratuito) concedido para usuario no suscrito.`,
      );
    } else {
      this.logger.log(
        `findOne(): Acceso completo al capítulo ${chapter.chapter_number} para usuario suscrito/admin.`,
      );
    }

    const chapterDto = plainToInstance(ChapterDto, chapter);
    chapterDto.pages = pagesArray;
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
      throw new NotFoundException(
        `Capítulo con ID "${id}" no encontrado para actualizar.`,
      );
    }

    const {
      title_id,
      pages,
      release_date,
      chapter_number,
      ...restOfUpdateDto
    } = updateChapterDto;

    if (
      (chapter_number !== undefined &&
        chapter_number !== chapter.chapter_number) ||
      (title_id !== undefined && title_id !== chapter.title_id)
    ) {
      const targetTitleId =
        title_id !== undefined ? title_id : chapter.title_id;
      const targetChapterNumber =
        chapter_number !== undefined ? chapter_number : chapter.chapter_number;

      const existingChapterWithNumber =
        await this.chapterRepository.findByTitleIdAndChapterNumber(
          targetTitleId,
          targetChapterNumber,
        );

      if (
        existingChapterWithNumber &&
        existingChapterWithNumber.chapter_id !== id
      ) {
        this.logger.warn(
          `update(): Conflicto: Capítulo número "${targetChapterNumber}" ya existe para el título ID "${targetTitleId}".`,
        );
        throw new ConflictException(
          `El capítulo número "${targetChapterNumber}" ya existe para este título.`,
        );
      }
    }

    if (title_id !== undefined) {
      const title = await this.titleRepository.findOneById(title_id);
      if (!title) {
        this.logger.warn(
          `update(): Título con ID "${title_id}" no encontrado para reasignar capítulo.`,
        );
        throw new NotFoundException(
          `Título con ID "${title_id}" no encontrado.`,
        );
      }
      chapter.title_id = title_id;
    }

    if (release_date !== undefined) {
      chapter.release_date = release_date ? new Date(release_date) : null;
    }

    if (pages !== undefined) {
      // CLAVE: Guardar DTO.pages como JSON string en DB.content_url
      chapter.pages = JSON.stringify(pages); // chapter.pages en entidad es en realidad chapter.content_url
    }

    Object.assign(chapter, restOfUpdateDto, { chapter_number: chapter_number });

    const updatedChapter = await this.chapterRepository.save(chapter);
    this.logger.log(
      `update(): Capítulo "${updatedChapter.name}" (ID: ${updatedChapter.chapter_id}) actualizado exitosamente.`,
    );

    const chapterDto = plainToInstance(ChapterDto, updatedChapter);
    // CLAVE: Parsear content_url desde la entidad para llenar DTO.pages
    if (updatedChapter.pages) {
      // updatedChapter.pages en entidad es en realidad updatedChapter.content_url
      chapterDto.pages = JSON.parse(updatedChapter.pages);
    } else {
      chapterDto.pages = [];
    }
    return chapterDto;
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`remove(): Eliminando capítulo con ID: ${id}`);
    const chapter = await this.chapterRepository.findOneById(id);
    if (!chapter) {
      this.logger.warn(
        `remove(): Capítulo con ID "${id}" no encontrado para eliminar.`,
      );
      throw new NotFoundException(
        `Capítulo con ID "${id}" no encontrado para eliminar.`,
      );
    }
    try {
      const deleteResult = await this.chapterRepository.delete(id);
      if (deleteResult.affected === 0) {
        this.logger.warn(
          `remove(): Capítulo con ID "${id}" no se pudo eliminar (no afectado).`,
        );
        throw new NotFoundException(`Capítulo con ID "${id}" no encontrado.`);
      }
      this.logger.log(
        `remove(): Capítulo con ID "${id}" eliminado exitosamente.`,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `remove(): Error al eliminar capítulo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error interno al eliminar el capítulo.',
      );
    }
  }
}
