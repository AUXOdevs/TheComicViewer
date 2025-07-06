// src/user/dto/update-user.dto.ts
import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsUUID,
  IsDate,
  IsEmail,
  ValidateNested, // Importar para objetos anidados
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// DTO para los permisos de administrador anidados
export class AdminPermissionsDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para gestionar contenido.',
    required: false,
    example: true,
  })
  content_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para gestionar usuarios.',
    required: false,
    example: true,
  })
  user_permission?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Permiso para moderación.',
    required: false,
    example: true,
  })
  moderation_permission?: boolean;
}

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
  @IsEmail()
  @ApiProperty({
    description: 'Nueva dirección de correo electrónico del usuario.',
    required: false,
    example: 'new.email@example.com',
  })
  email?: string;

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
  @IsUUID()
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

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminPermissionsDto)
  @ApiProperty({
    description: 'Permisos de administrador si el rol es Admin o Superadmin.',
    required: false,
    type: AdminPermissionsDto,
  })
  admin_permissions?: AdminPermissionsDto; // Añadido de nuevo
}
