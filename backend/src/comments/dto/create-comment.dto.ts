import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  // user_id se obtendrá del token JWT
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del título al que pertenece el comentario.' })
  title_id: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({
    description: 'ID del capítulo al que pertenece el comentario (si aplica).',
    required: false,
  })
  chapter_id?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Contenido del comentario.' })
  comment_text: string;
}
