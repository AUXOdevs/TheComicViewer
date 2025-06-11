import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Title } from './entities/title.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TitleRepository {
  constructor(
    @InjectRepository(Title)
    private readonly titleORMRepository: Repository<Title>,
  ) {}

  // Este método privado es para encapsular el inicio de la consulta.
  // Es donde añadimos las relaciones para "eager loading".
  private createQueryBuilderWithRelations(alias = 'title') {
    return this.titleORMRepository
      .createQueryBuilder(alias)
      .leftJoinAndSelect('title.chapters', 'chapters')
      .leftJoinAndSelect('title.titleGenres', 'titleGenre')
      .leftJoinAndSelect('titleGenre.genre', 'genre')
      .leftJoinAndSelect('title.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser') // También el usuario que hizo el comentario
      .leftJoinAndSelect('title.ratings', 'ratings')
      .leftJoinAndSelect('ratings.user', 'ratingUser') // También el usuario que hizo la calificación
      .leftJoinAndSelect('title.favorites', 'favorites'); // Los favoritos
    // NOTA: 'readingHistory' NO se carga aquí porque es una relación OneToMany
    // y su lógica es específica de cada USUARIO. Se debe cargar a través del historial
    // de lectura del usuario, no directamente del título global.
  }

  async findAll(): Promise<Title[]> {
    return this.createQueryBuilderWithRelations('title').getMany();
  }

  async findOneById(titleId: string): Promise<Title | null> {
    return this.createQueryBuilderWithRelations('title')
      .where('title.title_id = :titleId', { titleId })
      .getOne();
  }

  async findByName(name: string): Promise<Title | null> {
    return this.titleORMRepository
      .createQueryBuilder('title') // Este no necesita cargar relaciones completas si solo es para verificar existencia
      .where('title.name = :name', { name })
      .getOne();
  }

  create(titlePartial: Partial<Title>): Title {
    return this.titleORMRepository.create(titlePartial);
  }

  async save(title: Title): Promise<Title> {
    return this.titleORMRepository.save(title);
  }

  async delete(titleId: string): Promise<void> {
    await this.titleORMRepository.delete(titleId);
  }
}
