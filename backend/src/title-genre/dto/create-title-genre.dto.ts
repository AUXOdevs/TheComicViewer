import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTitleGenreDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID del título a asociar.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  title_id: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID del género a asociar.',
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
  })
  genre_id: string;
}
