import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nuevo nombre del usuario.',
    required: false,
    example: 'Jane Doe',
  })
  name?: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'Nueva URL de la foto de perfil del usuario.',
    required: false,
  })
  picture?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el usuario está bloqueado.',
    required: false,
    example: true,
  })
  is_blocked?: boolean;

  @IsOptional()
  @IsUUID() // Si el role se actualiza por ID
  @ApiProperty({
    description: 'Nuevo ID del rol asignado al usuario.',
    required: false,
    example: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
    nullable: true,
  })
  role_id?: string;
}
