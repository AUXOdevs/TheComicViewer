// src/chapters/dto/create-chapter.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ArrayMinSize,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChapterDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del título al que pertenece el capítulo.' })
  title_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del capítulo.' })
  name: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Fecha de lanzamiento del capítulo (formato ISO 8601).',
    nullable: true,
  })
  release_date?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true, message: 'Cada elemento debe ser una URL válida.' })
  @ApiProperty({
    description: 'Array de URLs (o rutas) de las páginas del capítulo.',
    type: [String],
    example: [
      'http://ejemplo.com/pagina1.jpg',
      'http://ejemplo.com/pagina2.jpg',
    ],
  })
  pages: string[]; // La API externa sigue usando 'pages'

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Número del capítulo.' })
  chapter_number: number;
}
