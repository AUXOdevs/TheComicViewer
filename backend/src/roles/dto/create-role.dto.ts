// src/roles/dto/create-role.dto.ts
import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  // Permite ahora la creación de roles Registrado, Suscrito, admin y superadmin
  @IsIn(['Registrado', 'Suscrito', 'admin', 'superadmin'], {
    message:
      'El nombre del rol debe ser Registrado, Suscrito, admin o superadmin.',
  })
  @ApiProperty({
    description: 'Nombre único del rol.',
    example: 'superadmin',
    enum: ['Registrado', 'Suscrito', 'admin', 'superadmin'],
  })
  name: string;
}
