import { IsBoolean, IsOptional, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description:
      'ID del usuario al que se le otorgan permisos de administrador.',
  })
  user_id: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para gestionar contenido.',
    default: true,
    required: false,
  })
  content_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para gestionar usuarios.',
    default: true,
    required: false,
  })
  user_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para moderar.',
    default: true,
    required: false,
  })
  moderation_permission?: boolean;
}
