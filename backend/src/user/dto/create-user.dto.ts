import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Auth0 ID del usuario' })
  @IsString()
  @IsNotEmpty()
  auth0_id: string;

  @ApiProperty({ description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty()
  name: string; // ¡Confirmado, es 'name'!

  @ApiProperty({
    description: 'ID del rol del usuario (UUID)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  role_id?: string;

  @ApiProperty({ description: 'Si el email está verificado', required: false })
  @IsOptional()
  email_verified?: boolean;

  @ApiProperty({ description: 'URL de la imagen de perfil', required: false })
  @IsOptional()
  picture?: string;
}
