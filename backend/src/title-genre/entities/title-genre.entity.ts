import { Genre } from 'src/genres/entities/genre.entity';
import { Title } from 'src/titles/entities/title.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('title_genre')
export class TitleGenre {
  @PrimaryGeneratedColumn('uuid')
  title_genre_id: string;

  @ManyToOne(() => Title)
  title: Title;

  @ManyToOne(() => Genre)
  genre: Genre;
}
