import { IsUUID, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReadingHistoryDto {
  // user_id se obtendrá del token JWT
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del capítulo leído.' })
  chapter_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0) // Puede ser 0 si empieza desde el inicio
  @ApiProperty({
    description: 'Última página leída del capítulo.',
    nullable: true,
  })
  last_page?: number | null;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el capítulo fue completado.',
    default: false,
  })
  completed?: boolean;
}
