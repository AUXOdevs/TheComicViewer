import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Nuevo nombre del capítulo.', required: false })
  name?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Nueva fecha de lanzamiento del capítulo (formato ISO 8601).',
    required: false,
    example: '2024-06-01T15:00:00Z',
  })
  release_date?: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'Nuevas URLs o paths de las páginas del capítulo.',
    required: false,
    example:
      '["https://example.com/new-page1.jpg", "https://example.com/new-page2.jpg"]',
  })
  pages?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: 'Nuevo número de capítulo.',
    required: false,
    example: 2,
  })
  chapter_number?: number;
}
