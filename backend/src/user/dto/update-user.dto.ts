import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsUUID,
  IsDate,
  IsEmail, // Importar IsEmail
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger'; // PartialType ya está ahí, solo asegurarse
import { Type } from 'class-transformer';

// Ya no extiende CreateUserDto, ya que CreateUserDto fue eliminado.
// Ahora solo define los campos que se pueden actualizar.
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
  @IsEmail() // Validar que sea un email válido
  @ApiProperty({
    description: 'Nueva dirección de correo electrónico del usuario.',
    required: false,
    example: 'new.email@example.com',
  })
  email?: string; // <<-- AÑADIDO DE NUEVO

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

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha y hora de inactivación de la cuenta (si aplica).',
    type: 'string',
    format: 'date-time',
    nullable: true,
    required: false,
  })
  deleted_at?: Date | null;
}
