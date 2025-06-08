import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { UserDto } from '../../user/dto/user.dto';
import { TitleDto } from '../../titles/dto/title.dto';
import { ChapterDto } from '../../chapters/dto/chapter.dto';

export class CommentDto {
  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID único del comentario.' })
  comment_id: string;

  @IsString()
  @ApiProperty({ description: 'ID del usuario que escribió el comentario.' })
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
  @ApiProperty({ description: 'ID del título al que pertenece el comentario.' })
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
    description: 'ID del capítulo al que pertenece el comentario (si aplica).',
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

  @IsString()
  @ApiProperty({ description: 'Contenido del comentario.' })
  content: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha del comentario.',
    type: 'string',
    format: 'date-time',
  })
  comment_date: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de última actualización del registro.',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;
}
