import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDate,
  IsNumber,
  IsArray,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TitleDto } from '../../titles/dto/title.dto'; // Si quieres anidar el título

export class ChapterDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID único del capítulo.' })
  chapter_id: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del título al que pertenece el capítulo.' })
  title_id: string;

  @IsOptional()
  @Type(() => TitleDto)
  @ApiProperty({
    description: 'Información del título asociado.',
    type: () => TitleDto,
    nullable: true,
  })
  title?: TitleDto; // Opcional, para incluir el título si se necesita

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del capítulo.' })
  name: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de lanzamiento del capítulo.',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  release_date?: Date | null;

  @IsArray()
  @IsUrl({}, { each: true })
  @ApiProperty({
    description: 'URLs (o rutas) de las páginas del capítulo.',
    type: [String],
  })
  pages: string[];

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Número del capítulo.' })
  chapter_number: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de creación del registro.',
    type: 'string',
    format: 'date-time',
  })
  created_at: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de última actualización del registro.',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;
}
