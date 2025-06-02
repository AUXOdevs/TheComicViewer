import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenreDto {
  @IsUUID()
  @ApiProperty({ description: 'ID único del género.' })
  genre_id: string;

  @IsString()
  @ApiProperty({ description: 'Nombre del género.' })
  name: string;
}
