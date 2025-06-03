// src/roles/dto/update-role.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['Registrado', 'Suscrito'], {
    // <-- ¡Cambiado aquí!
    message: 'El nombre del rol debe ser Registrado o Suscrito.',
  })
  @ApiProperty({
    description: 'Nuevo nombre único del rol.',
    required: false,
    example: 'Suscrito',
    enum: ['Registrado', 'Suscrito'],
  })
  name?: string;
}
