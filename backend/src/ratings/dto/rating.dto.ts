import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDate,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserDto } from '../../user/dto/user.dto';
import { TitleDto } from '../../titles/dto/title.dto';
import { ChapterDto } from '../../chapters/dto/chapter.dto';

export class RatingDto {
  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID único de la calificación.' })
  rating_id: string;

  @IsString()
  @ApiProperty({ description: 'ID del usuario que realizó la calificación.' })
  user_id: string;

  @IsOptional()
  @Type(() => UserDto)
  @ApiProperty({
    description: 'Información del usuario asociado.',
    type: () => UserDto,
    nullable: true,
  })
  user?: UserDto;

  @IsUUID()
  @IsString()
  @ApiProperty({
    description: 'ID del título al que pertenece la calificación.',
  })
  title_id: string;

  @IsOptional()
  @Type(() => TitleDto)
  @ApiProperty({
    description: 'Información del título asociado.',
    type: () => TitleDto,
    nullable: true,
  })
  title?: TitleDto;

  @IsOptional()
  @IsUUID()
  @IsString()
  @ApiProperty({
    description:
      'ID del capítulo al que pertenece la calificación (si aplica).',
    nullable: true,
  })
  chapter_id?: string | null;

  @IsOptional()
  @Type(() => ChapterDto)
  @ApiProperty({
    description: 'Información del capítulo asociado.',
    type: () => ChapterDto,
    nullable: true,
  })
  chapter?: ChapterDto;

  @IsNumber()
  @ApiProperty({
    description: 'Puntuación de la calificación (entre 1 y 5).',
    minimum: 1,
    maximum: 5,
  })
  score: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de la calificación.',
    type: 'string',
    format: 'date-time',
  })
  rating_date: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de última actualización del registro.',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;
}
