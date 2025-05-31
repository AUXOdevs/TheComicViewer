import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Title } from '../titles/title.entity';
import { Genre } from '../genres/genre.entity';

@Entity('title_genre')
export class TitleGenre {
  @PrimaryGeneratedColumn('uuid')
  title_genre_id: string;

  @ManyToOne(() => Title)
  title: Title;

  @ManyToOne(() => Genre)
  genre: Genre;
}
