// src/reading-history/dto/get-all-reading-history.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Reutilizamos el enum OrderDirection de módulos anteriores
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetAllReadingHistoryDto {
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
      'Columna por la que ordenar (ej. `access_date`, `updated_at`, `user.name`, `title.name`, `chapter.chapter_number`).',
    required: false,
    default: 'updated_at',
    example: 'updated_at',
  })
  sortBy?: string = 'updated_at';

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
      'Filtrar historial por el ID del usuario que lo posee (solo para Admin/Superadmin con `user_permission`).',
    required: false,
    example: 'auth0|abcdef1234567890',
  })
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar historial por el nombre de usuario (columna `name` en la tabla de usuarios, búsqueda parcial, insensible a mayúsculas/minúsculas).',
    required: false,
    example: 'juanito',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar historial por el nombre del título (búsqueda parcial, insensible a mayúsculas/minúsculas).',
    required: false,
    example: 'solo leveling',
  })
  titleName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar historial por el nombre del capítulo (búsqueda parcial, insensible a mayúsculas/minúsculas).',
    required: false,
    example: 'el inicio',
  })
  chapterName?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiProperty({
    description:
      'Filtrar historial por estado de completado (true para completados, false para no completados).',
    required: false,
    example: true,
  })
  completed?: boolean;
}
