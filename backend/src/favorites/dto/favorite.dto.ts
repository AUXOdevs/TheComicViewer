import { IsUUID, IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../user/dto/user.dto'; // Asegúrate de que la ruta sea correcta
import { TitleDto } from '../../titles/dto/title.dto'; // Asegúrate de que la ruta sea correcta
import { ChapterDto } from '../../chapters/dto/chapter.dto'; // Asegúrate de que la ruta sea correcta

export class FavoriteDto {
  @IsUUID()
  @ApiProperty({ description: 'ID único de la entrada de favorito.' })
  favorite_id: string;

  @ApiProperty({
    type: () => UserDto,
    description: 'Información del usuario que marcó el favorito.',
  })
  user: UserDto;

  @IsOptional()
  @ApiProperty({
    type: () => TitleDto,
    description: 'Información del título favorito (si aplica).',
    nullable: true,
  })
  title?: TitleDto;

  @IsOptional()
  @ApiProperty({
    type: () => ChapterDto,
    description: 'Información del capítulo favorito (si aplica).',
    nullable: true,
  })
  chapter?: ChapterDto;

  @IsDate()
  @ApiProperty({
    description: 'Fecha en que se añadió a favoritos.',
    type: 'string',
    format: 'date-time',
  })
  date_added: Date;
}
