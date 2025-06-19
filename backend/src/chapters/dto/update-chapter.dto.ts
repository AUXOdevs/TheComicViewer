// src/chapters/dto/update-chapter.dto.ts
import { PartialType, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsDateString,
  Min,
  IsArray, // Importante: indica que es un array
  ArrayMinSize, // Opcional: para asegurar al menos un elemento en el array
  IsUUID, // Si puedes cambiar el title_id en el PATCH
} from 'class-validator';
import { CreateChapterDto } from './create-chapter.dto';

export class UpdateChapterDto extends PartialType(CreateChapterDto) {
  // Las propiedades 'name', 'release_date', 'chapter_number' son heredadas
  // de CreateChapterDto y se hacen opcionales por PartialType.
  // No necesitas declararlas aquí de nuevo a menos que quieras
  // cambiar sus validaciones o descripciones de Swagger específicamente para el update.

  @IsOptional()
  @IsUUID() // Si se permite actualizar el title_id del capítulo
  @ApiProperty({
    description: 'ID del título al que pertenece el capítulo',
    example: '996d7681-f76d-4e6f-bfa0-8af7aa83f83c',
    required: false,
  })
  title_id?: string;

  @IsOptional()
  @IsArray({ message: 'pages must be an array of URL addresses' }) // Mensaje de error más claro si no es un array
  @ArrayMinSize(1, { message: 'pages must contain at least 1 URL' }) // Opcional: requiere al menos 1 URL
  @IsUrl(
    {},
    { each: true, message: 'Each page entry must be a valid URL address' },
  ) // Valida cada elemento como URL
  @ApiProperty({
    description: 'Nuevas URLs o rutas de las páginas del capítulo.',
    required: false,
    type: [String], // Esto le dice a Swagger que es un array de strings
    example: [
      'https://example.com/new-page1.jpg',
      'https://example.com/new-page2.jpg',
      'https://example.com/new-page3.jpg',
    ],
  })
  pages?: string[]; // ¡CORRECCIÓN CLAVE: el tipo debe ser string[]!
}
