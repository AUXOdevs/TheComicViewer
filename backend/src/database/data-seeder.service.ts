import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { TitlesService } from '../titles/titles.service';
import { ChaptersService } from '../chapters/chapters.service';
import { GenresService } from '../genres/genres.service';
import { TitleGenreService } from '../title-genre/title-genre.service';
import { CreateTitleDto } from '../titles/dto/create-title.dto';
import { CreateChapterDto } from '../chapters/dto/create-chapter.dto';
import { CreateGenreDto } from '../genres/dto/create-genre.dto';
import { CreateTitleGenreDto } from '../title-genre/dto/create-title-genre.dto';
import { RolesRepository } from '../roles/roles.repository';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { SettingRepository } from 'src/settings/setting.repository';

@Injectable()
export class DataSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DataSeederService.name);
  private readonly SEED_FLAG_KEY = 'initial_data_seeded';
  private readonly JSON_FILE_PATH = path.join(
    process.cwd(),
    'initial_comic_data.json',
  );
  private readonly DEFAULT_ROLES = [
    { name: 'Registrado' },
    { name: 'Suscrito' },
    { name: 'admin' },
  ];

  constructor(
    private readonly dataSource: DataSource,
    private readonly settingRepository: SettingRepository,
    private readonly titlesService: TitlesService,
    private readonly chaptersService: ChaptersService,
    private readonly genresService: GenresService,
    private readonly titleGenreService: TitleGenreService,
    private readonly rolesRepository: RolesRepository,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaultRoles();
    await this.seedInitialData();
  }

  private async seedDefaultRoles() {
    this.logger.log('Verificando y sembrando roles por defecto...');
    for (const roleData of this.DEFAULT_ROLES) {
      const existingRole = await this.rolesRepository.findByName(roleData.name);
      if (!existingRole) {
        try {
          const newRole = await this.rolesRepository.save(
            this.rolesRepository.create(roleData as CreateRoleDto),
          );
          this.logger.log(
            `Rol "${newRole.name}" (ID: ${newRole.role_id}) sembrado exitosamente.`,
          );
        } catch (error) {
          this.logger.warn(
            `Error sembrando rol "${roleData.name}": ${error.message}`,
          );
        }
      } else {
        this.logger.debug(`Rol "${roleData.name}" ya existe.`);
      }
    }
  }

  private async seedInitialData() {
    this.logger.log('Iniciando proceso de sembrado de datos...');

    const seededFlag = await this.settingRepository.findByKey(
      this.SEED_FLAG_KEY,
    );
    if (seededFlag && seededFlag.value === 'true') {
      this.logger.log('Los datos iniciales ya han sido sembrados. Omitiendo.');
      return;
    }

    let rawData: any[];
    try {
      const fileContent = fs.readFileSync(this.JSON_FILE_PATH, 'utf8');
      rawData = JSON.parse(fileContent);
      this.logger.log(
        `Archivo de datos '${this.JSON_FILE_PATH}' cargado con ${rawData.length} títulos.`,
      );
    } catch (error) {
      this.logger.error(
        `Error al cargar el archivo JSON de datos iniciales: ${error.message}`,
      );
      this.logger.error(
        'Asegúrate de que initial_comic_data.json exista en la raíz de tu proyecto.',
      );
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const titleData of rawData) {
        this.logger.debug(`Procesando título: ${titleData.name}`);

        let titleEntity = await this.titlesService[
          'titleRepository'
        ].findByName(titleData.name);

        if (!titleEntity) {
          const createTitleDto: CreateTitleDto = {
            name: titleData.name,
            description: titleData.description,
            author: titleData.author,
            type: titleData.type,
            status: titleData.status,
            publication_date: titleData.publication_date,
            image_url: titleData.image_url,
            category: titleData.category,
          };
          titleEntity = await this.titlesService['titleRepository'].save(
            this.titlesService['titleRepository'].create({
              ...createTitleDto,
              publication_date: createTitleDto.publication_date
                ? new Date(createTitleDto.publication_date)
                : null,
            }),
          );
          this.logger.log(`Título creado: ${titleEntity.name}`);
        } else {
          this.logger.debug(`Título ya existe: ${titleEntity.name}`);
        }

        for (const chapterData of titleData.chapters) {
          this.logger.debug(
            `  Procesando capítulo: ${chapterData.name} (${chapterData.chapter_number})`,
          );

          let chapterEntity = await this.chaptersService[
            'chapterRepository'
          ].findByTitleIdAndChapterNumber(
            titleEntity.title_id,
            chapterData.chapter_number,
          );

          if (!chapterEntity) {
            const createChapterDto: CreateChapterDto = {
              title_id: titleEntity.title_id,
              name: chapterData.name,
              release_date: chapterData.release_date,
              pages: chapterData.pages,
              chapter_number: chapterData.chapter_number,
            };
            chapterEntity = await this.chaptersService[
              'chapterRepository'
            ].save(
              this.chaptersService['chapterRepository'].create({
                ...createChapterDto,
                release_date: createChapterDto.release_date
                  ? new Date(createChapterDto.release_date)
                  : null,
                pages: JSON.stringify(createChapterDto.pages), // Guardar como string JSON
              }),
            );
            this.logger.log(`  Capítulo creado: ${chapterEntity.name}`);
          } else {
            this.logger.debug(`  Capítulo ya existe: ${chapterEntity.name}`);
          }
        }

        for (const genreName of titleData.genres || []) {
          this.logger.debug(`    Procesando género: ${genreName}`);
          let genreEntity =
            await this.genresService['genreRepository'].findByName(genreName);
          if (!genreEntity) {
            const createGenreDto: CreateGenreDto = { name: genreName };
            genreEntity = await this.genresService['genreRepository'].save(
              this.genresService['genreRepository'].create(createGenreDto),
            );
            this.logger.log(`    Género creado: ${genreEntity.name}`);
          } else {
            this.logger.debug(`    Género ya existe: ${genreEntity.name}`);
          }

          const existingTitleGenre = await this.titleGenreService[
            'titleGenreRepository'
          ].findOneByTitleAndGenre(titleEntity.title_id, genreEntity.genre_id);

          if (!existingTitleGenre) {
            const createTitleGenreDto: CreateTitleGenreDto = {
              title_id: titleEntity.title_id,
              genre_id: genreEntity.genre_id,
            };
            await this.titleGenreService['titleGenreRepository'].save(
              this.titleGenreService['titleGenreRepository'].create(
                createTitleGenreDto,
              ),
            );
            this.logger.log(
              `    Asociación Título-Género creada: ${titleEntity.name} - ${genreEntity.name}`,
            );
          } else {
            this.logger.debug(
              `    Asociación Título-Género ya existe: ${titleEntity.name} - ${genreEntity.name}`,
            );
          }
        }
      }

      await queryRunner.commitTransaction(); // Esto libera el queryRunner
      await this.settingRepository.save(
        this.settingRepository.create({
          key: this.SEED_FLAG_KEY,
          value: 'true',
        }),
      );
      this.logger.log('Proceso de sembrado de datos completado exitosamente.');
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Esto también libera el queryRunner
      this.logger.error(
        `Error durante el proceso de sembrado de datos: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to seed initial data.');
    } finally {
      // Remover la llamada a queryRunner.release() de aquí, ya que commit/rollback la liberan.
      // await queryRunner.release();
    }
  }
}
