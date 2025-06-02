import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para gestionar contenido.',
    required: false,
  })
  content_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para gestionar usuarios.',
    required: false,
  })
  user_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: 'Permiso para moderar.', required: false })
  moderation_permission?: boolean;
}
