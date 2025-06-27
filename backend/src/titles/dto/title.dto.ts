// src/titles/dto/title.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate, // <-- Importante: para validar objeto Date
  IsUrl,
  IsUUID, // Para title_id
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChapterDto } from '../../chapters/dto/chapter.dto';
import { GenreDto } from '../../genres/dto/genre.dto';

export class TitleDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID() // Asumo que title_id es UUID
  @ApiProperty({ description: 'ID único del título.' })
  title_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del título.' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Descripción detallada.', nullable: true })
  description?: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Autor.', nullable: true })
  author?: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Género (campo obsoleto en DB).',
    nullable: true,
  })
  genre?: string | null;

  @IsEnum(['comic', 'manga'])
  @ApiProperty({ description: 'Tipo de título.', enum: ['comic', 'manga'] })
  type: 'comic' | 'manga';

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Estado.', nullable: true })
  status?: string | null;

  @IsOptional()
  @IsDate() // <<-- Tipo: Date
  @Type(() => Date) // <<-- Transformador necesario
  @ApiProperty({
    description: 'Fecha de publicación.',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  publication_date?: Date | null; // <<-- Tipo: Date

  @IsOptional()
  @IsUrl()
  @ApiProperty({ description: 'URL de la imagen de portada.', nullable: true })
  image_url?: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Categoría adicional.', nullable: true })
  category?: string | null;

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

  @IsOptional()
  @ApiProperty({
    type: [ChapterDto],
    description: 'Lista de capítulos asociados al título.',
    nullable: true,
  })
  @Type(() => ChapterDto)
  chapters?: ChapterDto[];

  @IsOptional()
  @ApiProperty({
    type: [GenreDto],
    description: 'Lista de géneros asociados al título.',
    nullable: true,
  })
  @Type(() => GenreDto)
  genres?: GenreDto[];
}
