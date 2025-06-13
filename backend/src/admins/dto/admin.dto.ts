import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsString } from 'class-validator';

export class AdminDto {
  @IsUUID()
  @ApiProperty({ description: 'ID único del administrador.' })
  admin_id: string;

  @IsString()
  @ApiProperty({ description: 'ID del usuario asociado a este administrador.' })
  user_id: string; // O podrías incluir un DTO completo de User si necesitas más detalles.

  @IsBoolean()
  @ApiProperty({ description: 'Permiso para gestionar contenido.' })
  content_permission: boolean;

  @IsBoolean()
  @ApiProperty({ description: 'Permiso para gestionar usuarios.' })
  user_permission: boolean;

  @IsBoolean()
  @ApiProperty({ description: 'Permiso para moderar.' })
  moderation_permission: boolean;
}
