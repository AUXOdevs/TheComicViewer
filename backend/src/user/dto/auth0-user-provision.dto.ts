import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Auth0UserProvisionDto {
  @ApiProperty({ description: 'Auth0 ID (sub) del usuario' })
  @IsString()
  @IsNotEmpty()
  auth0Id: string; // Coincide con 'sub' de Auth0

  @ApiProperty({ description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty()
  name: string; // Coincide con 'name' de Auth0

  @ApiProperty({
    description: 'Si el email del usuario está verificado',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty({
    description: 'URL de la imagen de perfil del usuario',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  picture?: string;
}
