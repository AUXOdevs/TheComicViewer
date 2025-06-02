import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TitleDto } from '../../titles/dto/title.dto'; // Asegúrate de que la ruta sea correcta
import { GenreDto } from '../../genres/dto/genre.dto'; // Asegúrate de que la ruta sea correcta

export class TitleGenreDto {
  @IsUUID()
  @ApiProperty({ description: 'ID único de la asociación Título-Género.' })
  title_genre_id: string;

  @ApiProperty({
    type: () => TitleDto,
    description: 'Información del título asociado.',
  })
  title: TitleDto;

  @ApiProperty({
    type: () => GenreDto,
    description: 'Información del género asociado.',
  })
  genre: GenreDto;
}
