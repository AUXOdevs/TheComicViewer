// src/comments/dto/get-all-comments.dto.ts
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

// Reutilizamos el enum OrderDirection del módulo Chapters/Favorites
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetAllCommentsDto {
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
      'Columna por la que ordenar (ej. `comment_date`, `user.name`, `title.name`, `chapter.chapter_number`).',
    required: false,
    default: 'comment_date',
    example: 'comment_date',
  })
  sortBy?: string = 'comment_date';

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
    description: 'Filtrar comentarios por el ID del usuario que los creó.',
    required: false,
    example: 'auth0|abcdef1234567890',
  })
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar comentarios por el nombre de usuario (columna `name` en la tabla de usuarios, búsqueda parcial, insensible a mayúsculas/minúsculas).',
    required: false,
    example: 'juanito',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar comentarios por el nombre del título al que pertenecen (búsqueda parcial, insensible a mayúsculas/minúsculas).',
    required: false,
    example: 'one piece',
  })
  titleName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar comentarios por el nombre del capítulo al que pertenecen (búsqueda parcial, insensible a mayúsculas/minúsculas). Solo aplica a comentarios de capítulos.',
    required: false,
    example: 'el inicio',
  })
  chapterName?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiProperty({
    description:
      'Filtrar solo comentarios de títulos (true) o solo comentarios de capítulos (false). Si no se especifica, incluye ambos.',
    required: false,
    example: true,
  })
  isTitleComment?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar comentarios por texto (búsqueda parcial, insensible a mayúsculas/minúsculas).',
    required: false,
    example: 'gran historia',
  })
  commentText?: string;
}
