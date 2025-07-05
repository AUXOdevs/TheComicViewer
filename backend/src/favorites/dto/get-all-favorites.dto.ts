// src/favorites/dto/get-all-favorites.dto.ts
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
  
  // Reutilizamos el enum OrderDirection del módulo Chapters o lo definimos si no está global
  export enum OrderDirection {
    ASC = 'ASC',
    DESC = 'DESC',
  }
  
  export class GetAllFavoritesDto {
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
      description: 'Cantidad de elementos por página (por defecto: 10, máximo: 100).',
      required: false,
      default: 10,
      maximum: 100,
      example: 10,
    })
    limit?: number = 10;
  
    @IsOptional()
    @IsString()
    @ApiProperty({
      description: 'Columna por la que ordenar (ej. `date_added`, `title.name`, `chapter.chapter_number`).',
      required: false,
      default: 'date_added',
      example: 'date_added',
    })
    sortBy?: string = 'date_added';
  
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
      description: 'Filtrar favoritos por el nombre del título (búsqueda parcial, insensible a mayúsculas/minúsculas).',
      required: false,
      example: 'solo leveling',
    })
    titleName?: string;
  
    @IsOptional()
    @IsString()
    @ApiProperty({
      description: 'Filtrar favoritos por el nombre del capítulo (búsqueda parcial, insensible a mayúsculas/minúsculas). Solo aplica a favoritos de capítulos.',
      required: false,
      example: 'el inicio',
    })
    chapterName?: string;
  
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean) // Transforma la cadena de consulta a booleano
    @ApiProperty({
      description: 'Filtrar solo favoritos de títulos (true) o solo favoritos de capítulos (false). Si no se especifica, incluye ambos.',
      required: false,
      example: true,
    })
    isTitleFavorite?: boolean;
  }
  