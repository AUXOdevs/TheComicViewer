// src/chapters/dto/get-all-chapters.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID, // Para titleId
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Reutilizamos el enum OrderDirection del módulo Titles o lo definimos si no está global
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetAllChaptersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Transforma la cadena de consulta a número
  @ApiProperty({
    description: 'Número de página para la paginación (por defecto: 1).',
    required: false,
    default: 1,
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Transforma la cadena de consulta a número
  @ApiProperty({
    description:
      'Cantidad de elementos por página (por defecto: 10, máximo: 100).',
    required: false,
    default: 10,
    maximum: 100,
    example: 10,
  })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Columna por la que ordenar (ej. `created_at`, `name`, `chapter_number`, `release_date`).',
    required: false,
    default: 'created_at',
    example: 'created_at',
  })
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsEnum(OrderDirection)
  @ApiProperty({
    description: 'Dirección de la ordenación (`ASC` o `DESC`).',
    required: false,
    default: OrderDirection.DESC,
    enum: OrderDirection,
    example: OrderDirection.DESC,
  })
  order?: OrderDirection = OrderDirection.DESC;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar capítulos por nombre (búsqueda parcial, case-insensitive).',
    required: false,
    example: 'el inicio',
  })
  name?: string; // Filtro por nombre de capítulo

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    description: 'Filtrar capítulos por número de capítulo exacto.',
    required: false,
    example: 10,
  })
  chapterNumber?: number; // Filtro por número de capítulo

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description:
      'Filtrar capítulos por el ID exacto del título al que pertenecen.',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
  })
  titleId?: string; // Filtro por ID de título

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar capítulos por el nombre del título al que pertenecen (búsqueda parcial, case-insensitive).',
    required: false,
    example: 'one piece',
  })
  titleName?: string; // Filtro por nombre de título
}
