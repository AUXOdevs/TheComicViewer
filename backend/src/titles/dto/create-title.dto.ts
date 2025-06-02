import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUrl,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTitleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del título.', example: 'One Piece' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Descripción del título.',
    example: 'Las aventuras de Monkey D. Luffy y su tripulación.',
  })
  description: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Autor o creador del título.',
    example: 'Eiichiro Oda',
  })
  author: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['comic', 'manga']) // Valida que el tipo sea 'comic' o 'manga'
  @ApiProperty({
    description: "Tipo de título ('comic' o 'manga').",
    example: 'manga',
    enum: ['comic', 'manga'],
  })
  type: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description:
      'Estado actual del título (ej. "En curso", "Finalizado", "Pausado").',
    example: 'En curso',
  })
  status: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Fecha de publicación del título (formato ISO 8601).',
    required: false,
    example: '1997-07-22T00:00:00Z',
  })
  publication_date?: string; // Se usa string para la entrada, luego se convierte a Date en el servicio

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'URL de la imagen de portada del título.',
    required: false,
    example: 'https://example.com/onepiece_cover.jpg',
  })
  image_url?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description:
      'Categoría o género del título (ej. "Aventura", "Fantasia", "Ciencia ficción").',
    example: 'Aventura',
  })
  category: string;
}
