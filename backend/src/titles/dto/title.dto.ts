import { IsUUID, IsString, IsDate, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TitleDto {
  @IsUUID()
  @ApiProperty({ description: 'ID único del título.' })
  title_id: string;

  @IsString()
  @ApiProperty({ description: 'Nombre del título.' })
  name: string;

  @IsString()
  @ApiProperty({ description: 'Descripción del título.' })
  description: string;

  @IsString()
  @ApiProperty({ description: 'Autor o creador del título.' })
  author: string;

  @IsString()
  @ApiProperty({ description: "Tipo de título ('comic' o 'manga')." })
  type: string;

  @IsString()
  @ApiProperty({ description: 'Estado actual del título.' })
  status: string;

  @IsOptional()
  @IsDate() // Cuando se devuelve, ya es un objeto Date
  @ApiProperty({
    description: 'Fecha de publicación del título.',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  publication_date?: Date;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'URL de la imagen de portada del título.',
    nullable: true,
  })
  image_url?: string;

  @IsString()
  @ApiProperty({ description: 'Categoría o género del título.' })
  category: string;
}
