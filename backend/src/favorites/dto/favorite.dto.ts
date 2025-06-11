import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { UserDto } from '../../user/dto/user.dto';
import { TitleDto } from '../../titles/dto/title.dto';
import { ChapterDto } from '../../chapters/dto/chapter.dto';

export class FavoriteDto {
  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID único del favorito.' })
  favorite_id: string;

  @IsString()
  @ApiProperty({ description: 'ID del usuario que añadió el favorito.' })
  user_id: string;

  @IsOptional()
  @Type(() => UserDto)
  @ApiProperty({
    description: 'Información del usuario asociado.',
    type: () => UserDto,
    nullable: true,
  })
  user?: UserDto; // Opcional para cargar la relación

  @IsUUID()
  @IsString()
  @ApiProperty({ description: 'ID del título asociado al favorito.' })
  title_id: string;

  @IsOptional()
  @Type(() => TitleDto)
  @ApiProperty({
    description: 'Información del título asociado.',
    type: () => TitleDto,
    nullable: true,
  })
  title?: TitleDto; // Opcional para cargar la relación

  @IsOptional()
  @IsUUID()
  @IsString()
  @ApiProperty({
    description: 'ID del capítulo asociado al favorito (si aplica).',
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
  chapter?: ChapterDto; // Opcional para cargar la relación

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha en que se añadió el favorito.',
    type: 'string',
    format: 'date-time',
  })
  date_added: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha de última actualización del registro.',
    type: 'string',
    format: 'date-time',
  })
  updated_at: Date;
}
