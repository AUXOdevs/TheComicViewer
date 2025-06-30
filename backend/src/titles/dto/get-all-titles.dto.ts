// src/titles/dto/get-all-titles.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsIn, // Puede que no sea estrictamente necesario si usamos un enum
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Define un enum para la dirección de ordenación si no lo tienes ya
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetAllTitlesDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Importante para transformar la cadena de consulta a número
  @ApiProperty({
    description: 'Número de página para la paginación (por defecto: 1).',
    required: false,
    default: 1,
    example: 1,
  })
  page?: number = 1; // Valor por defecto en el DTO

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Importante para transformar la cadena de consulta a número
  @ApiProperty({
    description:
      'Cantidad de elementos por página (por defecto: 10, máximo: 100).',
    required: false,
    default: 10,
    maximum: 100,
    example: 10,
  })
  limit?: number = 10; // Valor por defecto en el DTO

  @IsOptional()
  @IsString()
  // Podemos añadir validación para los valores permitidos de sortBy
  @ApiProperty({
    description:
      'Columna por la que ordenar (ej. `created_at`, `name`, `publication_year`).',
    required: false,
    default: 'created_at',
    example: 'created_at',
  })
  sortBy?: string = 'created_at'; // Valor por defecto en el DTO

  @IsOptional()
  @IsEnum(OrderDirection) // Usar el enum que definimos
  @ApiProperty({
    description: 'Dirección de la ordenación (`ASC` o `DESC`).',
    required: false,
    default: OrderDirection.DESC,
    enum: OrderDirection,
    example: OrderDirection.DESC,
  })
  order?: OrderDirection = OrderDirection.DESC; // Valor por defecto en el DTO

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar títulos por nombre (búsqueda parcial, case-insensitive).',
    required: false,
    example: 'comic',
  })
  name?: string; // Filtro de nombre
}
