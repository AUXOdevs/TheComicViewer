// src/titles/dto/update-title.dto.ts
import {
  IsString,
  IsOptional,
  IsDateString, // <-- Importante: para validar que el string es una fecha válida
  IsUrl,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// No hereda de CreateTitleDto directamente en tu ejemplo, por lo que lo replico.
// Si hereda de PartialType(CreateTitleDto), entonces IsDateString iría en CreateTitleDto.
// Ya que está como lo pasaste, asumo que es un DTO independiente.
// Si usas PartialType(CreateTitleDto), esto ya está cubierto por el de arriba.

export class UpdateTitleDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nuevo nombre del título.',
    required: false,
    example: 'One Piece Red',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nueva descripción del título.',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Nuevo autor del título.', required: false })
  author?: string;

  @IsOptional()
  @IsString()
  @IsIn(['comic', 'manga'])
  @ApiProperty({
    description: "Nuevo tipo de título ('comic' o 'manga').",
    required: false,
    example: 'manga',
    enum: ['comic', 'manga'],
  })
  type?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nuevo estado del título.',
    required: false,
    example: 'Finalizado',
  })
  status?: string;

  @IsOptional()
  @IsDateString() // <-- Tipo: string, se valida como string de fecha
  @ApiProperty({
    description: 'Nueva fecha de publicación del título (formato ISO 8601).',
    required: false,
    example: '1997-07-22T00:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  publication_date?: string; // <<-- Tipo: string

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'Nueva URL de la imagen de portada del título.',
    required: false,
    example: 'https://example.com/new_onepiece_cover.jpg',
  })
  image_url?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nueva categoría o género del título.',
    required: false,
    example: 'Aventura',
  })
  category?: string;
}
