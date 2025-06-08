import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class GenreDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID único del género.' })
  genre_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del género.' })
  name: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de creación del registro.',
    type: 'string',
    format: 'date-time',
  })
  created_at: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de última actualización del registro.',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;
}
