// src/user/dto/user.dto.ts
import {
  IsString,
  IsEmail,
  IsUrl,
  IsBoolean,
  IsDate,
  IsOptional,
  // IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleDto } from '../../roles/dto/role.dto'; // Ajusta la ruta
import { Type } from 'class-transformer';

export class UserDto {
  @IsString()
  @ApiProperty({ description: 'ID único del usuario proporcionado por Auth0.' })
  auth0_id: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Nombre completo del usuario.', nullable: true })
  name: string | null;

  @IsEmail()
  @ApiProperty({
    description: 'Dirección de correo electrónico única del usuario.',
  })
  email: string;

  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el email del usuario ha sido verificado.',
  })
  email_verified: boolean;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'URL de la foto de perfil del usuario.',
    nullable: true,
  })
  picture?: string | null;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha y hora del último inicio de sesión.',
    type: 'string',
    format: 'date-time',
  })
  last_login: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fecha y hora de creación de la cuenta.',
    type: 'string',
    format: 'date-time',
  })
  created_at: Date;

  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el usuario está bloqueado por un admin.',
  })
  is_blocked: boolean;

  @IsOptional()
  @ApiProperty({
    type: () => RoleDto,
    description: 'Información del rol del usuario.',
    nullable: true,
  })
  role: RoleDto | null;

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
