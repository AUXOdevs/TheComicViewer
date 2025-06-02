// src/roles/dto/create-role.dto.ts
import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Registrado', 'Suscrito', 'Administrador'], {
    message: 'El nombre del rol debe ser Registrado, Suscrito o Administrador.',
  })
  @ApiProperty({
    description: 'Nombre único del rol.',
    example: 'Suscrito',
    enum: ['Registrado', 'Suscrito', 'Administrador'],
  })
  name: string;
}
