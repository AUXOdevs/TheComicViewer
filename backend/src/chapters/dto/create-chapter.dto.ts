import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUrl,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChapterDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del título al que pertenece este capítulo.' })
  title_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del capítulo.' })
  name: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description:
      'Fecha de lanzamiento del capítulo (formato ISO 8601, ej: 2023-10-27T10:00:00Z).',
    required: false,
    example: '2024-06-01T14:30:00Z',
  })
  release_date?: string; // Se usa string para la entrada, luego se convierte a Date en el servicio

//   @IsString()
  @IsUrl()
  @IsNotEmpty()
  // Podrías usar @IsUrl({ each: true }) si 'pages' es un array de URLs, o ajustar la validación según el formato de URLs/paths
  @ApiProperty({
    description:
      'URLs o paths de las páginas del capítulo (ej. URLs de S3 o paths a archivos). Puede ser un JSON string de un array de URLs.',
    example:
      '["https://example.com/page1.jpg", "https://example.com/page2.jpg"]',
  })
  pages: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Número de capítulo.', example: 1 })
  chapter_number: number;
}
