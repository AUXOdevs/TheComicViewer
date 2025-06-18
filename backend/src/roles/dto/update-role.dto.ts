// src/roles/dto/update-role.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  // Permite ahora la actualización de roles Registrado, Suscrito, admin y superadmin
  @IsIn(['Registrado', 'Suscrito', 'admin', 'superadmin'], {
    message:
      'El nombre del rol debe ser Registrado, Suscrito, admin o superadmin.',
  })
  @ApiProperty({
    description: 'Nuevo nombre único del rol.',
    required: false,
    example: 'Suscrito',
    enum: ['Registrado', 'Suscrito', 'admin', 'superadmin'],
  })
  name?: string;
}
