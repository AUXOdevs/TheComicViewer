import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReadingHistoryDto {
  // user_id NO se incluye aquí, se obtendrá del token JWT o se gestionará por admins

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID del título al que pertenece el capítulo leído.',
  })
  title_id: string; // Añadido title_id como obligatorio para consistencia

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del capítulo leído.' })
  chapter_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0) // La página puede ser 0 si empieza desde el inicio
  @ApiProperty({
    description: 'Última página leída del capítulo (opcional).',
    nullable: true,
    required: false,
  })
  last_page?: number | null;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description:
      'Indica si el capítulo fue completado (opcional, por defecto false).',
    default: false,
    required: false,
  })
  completed?: boolean;
}
