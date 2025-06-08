import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TitleDto } from '../../titles/dto/title.dto';
import { GenreDto } from '../../genres/dto/genre.dto';

export class TitleGenreDto {
  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID único de la asociación título-género.' })
  title_genre_id: string;

  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID del título asociado.' })
  title_id: string;

  @IsOptional()
  @Type(() => TitleDto)
  @ApiProperty({
    description: 'Información del título asociado.',
    type: () => TitleDto,
    nullable: true,
  })
  title?: TitleDto; // Opcional para cargar la relación

  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID del género asociado.' })
  genre_id: string;

  @IsOptional()
  @Type(() => GenreDto)
  @ApiProperty({
    description: 'Información del género asociado.',
    type: () => GenreDto,
    nullable: true,
  })
  genre?: GenreDto; // Opcional para cargar la relación

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
