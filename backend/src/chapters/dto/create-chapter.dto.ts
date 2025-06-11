import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ArrayMinSize,
  IsUrl, // Asumiendo que las páginas son URLs
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
    description: 'Fecha de lanzamiento del capítulo.',
    nullable: true,
  })
  release_date?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true }) // Cada elemento debe ser una URL válida
  @ApiProperty({
    description: 'Array de URLs (o rutas) de las páginas del capítulo.',
    type: [String],
    example: ['http://example.com/page1.jpg', 'http://example.com/page2.jpg'],
  })
  pages: string[];

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Número del capítulo.' })
  chapter_number: number;
}
