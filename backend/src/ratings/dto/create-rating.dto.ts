import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  // user_id se obtendrá del token JWT
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del título a calificar.' })
  title_id: string;

  @IsUUID()
  @IsOptional() // Opcional, si la calificación es para un capítulo específico
  @ApiProperty({
    description: 'ID del capítulo a calificar (si aplica).',
    required: false,
  })
  chapter_id?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: 'Puntuación de la calificación (entre 1 y 5).',
    minimum: 1,
    maximum: 5,
  })
  score: number;
}
