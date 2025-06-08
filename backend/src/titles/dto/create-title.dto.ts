import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTitleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del título (cómic o manga).' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Descripción detallada del título.',
    nullable: true,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Autor o creador del título.', nullable: true })
  author?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Género principal del título (ej. "Aventura", "Fantasia"). Este campo puede ser obsoleto si se usan title_genre.',
    nullable: true,
  })
  genre?: string;

  @IsEnum(['comic', 'manga'], {
    message: 'El tipo debe ser "comic" o "manga".',
  })
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tipo de título: "comic" o "manga".',
    enum: ['comic', 'manga'],
  })
  type: 'comic' | 'manga';

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Estado actual del título (ej. "En curso", "Completo").',
    nullable: true,
  })
  status?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Fecha de publicación del título (formato ISO 8601).',
    nullable: true,
  })
  publication_date?: string; // Usar string para la entrada, luego convertir a Date

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'URL de la imagen de portada del título.',
    nullable: true,
  })
  image_url?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Categoría adicional del título.',
    nullable: true,
  })
  category?: string;
}
