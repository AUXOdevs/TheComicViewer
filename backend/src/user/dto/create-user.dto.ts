import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUrl,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID único del usuario proporcionado por Auth0.',
    example: 'auth0|abcdef1234567890',
  })
  auth0_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nombre completo del usuario.',
    example: 'John Doe',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Dirección de correo electrónico única del usuario.',
    example: 'john.doe@example.com',
  })
  email: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'URL de la foto de perfil del usuario (opcional).',
    required: false,
    example: 'https://example.com/profile.jpg',
  })
  picture?: string;

  @IsOptional()
  @IsUUID() // Si el role se asigna por ID
  @ApiProperty({
    description:
      'ID del rol asignado al usuario (ej. "lector", "administrador").',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nullable: true,
  })
  role_id?: string; // Se usará para establecer la relación con Role

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
