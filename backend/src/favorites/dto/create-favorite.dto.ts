import { IsUUID, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID del usuario que marca el favorito.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  user_id: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description:
      'ID del título favorito (opcional si se especifica chapter_id).',
    required: false,
    example: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
  })
  title_id?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description:
      'ID del capítulo favorito (opcional si se especifica title_id).',
    required: false,
    example: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
  })
  chapter_id?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description:
      'Fecha en que se añadió a favoritos (formato ISO 8601). Se establecerá automáticamente si no se envía.',
    required: false,
    example: '2024-06-01T17:00:00Z',
  })
  date_added?: string; // Se usa string para la entrada, luego se convierte a Date en el servicio
}
