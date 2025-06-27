// src/chapters/dto/update-chapter.dto.ts
import { PartialType, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsDateString,
  Min,
  IsArray,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { CreateChapterDto } from './create-chapter.dto';

export class UpdateChapterDto extends PartialType(CreateChapterDto) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description:
      'Nuevo ID del título al que pertenece el capítulo (si se desea reasignar).',
    example: '996d7681-f76d-4e6f-bfa0-8af7aa83f83c',
    required: false,
  })
  title_id?: string;

  @IsOptional()
  @IsArray({ message: 'Las páginas deben ser un array de URLs.' })
  @ArrayMinSize(1, { message: 'Las páginas deben contener al menos 1 URL.' })
  @IsUrl(
    {},
    { each: true, message: 'Cada entrada de página debe ser una URL válida.' },
  )
  @ApiProperty({
    description: 'Nuevas URLs o rutas de las páginas del capítulo.',
    required: false,
    type: [String],
    example: [
      'https://ejemplo.com/nueva-pagina1.jpg',
      'https://ejemplo.com/nueva-pagina2.jpg',
      'https://ejemplo.com/nueva-pagina3.jpg',
    ],
  })
  pages?: string[]; // La API externa sigue usando 'pages'
}
