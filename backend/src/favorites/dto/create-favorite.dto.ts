import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  // user_id no se incluye aquí porque se obtendrá del token JWT del usuario autenticado (req.user)
  // title_id o chapter_id deben ser proporcionados, pero no ambos

  @IsUUID()
  @IsOptional() // Opcional, si se proporciona chapter_id
  @ApiProperty({
    description: 'ID del título a añadir a favoritos.',
    required: false,
  })
  title_id?: string;

  @IsUUID()
  @IsOptional() // Opcional, si se proporciona title_id
  @ApiProperty({
    description: 'ID del capítulo a añadir a favoritos.',
    required: false,
  })
  chapter_id?: string;
}
