import {
  IsString,
  IsOptional,
  IsDateString,
  IsUrl,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @IsDateString()
  @ApiProperty({
    description: 'Nueva fecha de publicación del título (formato ISO 8601).',
    required: false,
    example: '1997-07-22T00:00:00Z',
  })
  publication_date?: string;

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
