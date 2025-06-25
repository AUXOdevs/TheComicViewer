import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDate,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserDto } from '../../user/dto/user.dto';
import { ChapterDto } from '../../chapters/dto/chapter.dto';
import { TitleDto } from '../../titles/dto/title.dto'; // Importar TitleDto

export class ReadingHistoryDto {
  @IsUUID()
  @IsString()
  @ApiProperty({
    description: 'ID único del registro de historial de lectura.',
  })
  history_id: string;

  @IsString()
  @ApiProperty({ description: 'ID del usuario asociado al historial.' })
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
    description: 'ID del título al que pertenece el capítulo leído.',
  })
  title_id: string; // Incluir title_id aquí

  @IsOptional()
  @Type(() => TitleDto)
  @ApiProperty({
    description: 'Información del título asociado.',
    type: () => TitleDto,
    nullable: true,
  })
  title?: TitleDto; // Añadir DTO de relación de título

  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID del capítulo leído.' })
  chapter_id: string;

  @IsOptional()
  @Type(() => ChapterDto)
  @ApiProperty({
    description: 'Información del capítulo asociado.',
    type: () => ChapterDto,
    nullable: true,
  })
  chapter?: ChapterDto;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Última página leída del capítulo.',
    nullable: true,
  })
  last_page?: number | null;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha del último acceso al capítulo.',
    type: 'string',
    format: 'date-time',
  })
  access_date: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de última actualización del registro.',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;

  @IsBoolean()
  @ApiProperty({ description: 'Indica si el capítulo fue completado.' })
  completed: boolean;
}
