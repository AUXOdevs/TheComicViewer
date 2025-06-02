// src/roles/dto/update-role.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['Registrado', 'Suscrito', 'Administrador'], {
    message: 'El nombre del rol debe ser Registrado, Suscrito o Administrador.',
  })
  @ApiProperty({
    description: 'Nuevo nombre único del rol.',
    required: false,
    example: 'Administrador',
    enum: ['Registrado', 'Suscrito', 'Administrador'],
  })
  name?: string;
}
