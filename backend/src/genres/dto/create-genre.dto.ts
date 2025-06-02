import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del género.', example: 'Aventura' })
  name: string;
}
