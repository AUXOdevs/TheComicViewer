import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGenreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Aunque es opcional, si se envía, no debe ser vacío
  @ApiProperty({
    description: 'Nuevo nombre del género.',
    required: false,
    example: 'Fantasía',
  })
  name?: string;
}
