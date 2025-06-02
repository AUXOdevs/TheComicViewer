import { IsUUID, IsString, IsNumber, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TitleDto } from '../../titles/dto/title.dto'; // Asume que tienes un TitleDto

export class ChapterDto {
  @IsUUID()
  @ApiProperty({ description: 'ID único del capítulo.' })
  chapter_id: string;

  @ApiProperty({
    type: () => TitleDto,
    description: 'Información del título al que pertenece el capítulo.',
  })
  title: TitleDto; // Puedes incluir el DTO completo de Title si necesitas más detalles, o solo el title_id: string

  @IsString()
  @ApiProperty({ description: 'Nombre del capítulo.' })
  name: string;

  @IsDate() // Cuando se devuelve, ya es un objeto Date
  @ApiProperty({
    description: 'Fecha de lanzamiento del capítulo.',
    type: 'string',
    format: 'date-time',
  })
  release_date: Date;

  @IsString()
  @ApiProperty({ description: 'URLs o paths de las páginas del capítulo.' })
  pages: string;

  @IsNumber()
  @ApiProperty({ description: 'Número de capítulo.' })
  chapter_number: number;
}
