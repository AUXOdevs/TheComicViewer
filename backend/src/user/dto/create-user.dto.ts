import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNotEmpty, // Se mantiene para campos requeridos explícitamente (ej. name, email en registro original)
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsOptional() // Hacemos auth0_id opcional aquí porque AuthService lo construirá
  @IsString()
  @ApiProperty({
    description: 'ID único del usuario proporcionado por Auth0.',
    required: false,
  })
  auth0_id?: string;

  @IsOptional() // Hacer opcional si el nombre puede venir del token o ser por defecto
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty when explicitly provided.' }) // Condicionalmente NotEmpty
  @ApiProperty({ description: 'Nombre completo del usuario.' })
  name?: string; // Ahora es opcional

  @IsOptional() // Hacer opcional si el email puede venir del token o ser por defecto
  @IsEmail()
  @IsNotEmpty({ message: 'Email cannot be empty when explicitly provided.' }) // Condicionalmente NotEmpty
  @ApiProperty({
    description: 'Dirección de correo electrónico única del usuario.',
  })
  email?: string; // Ahora es opcional

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el email del usuario ha sido verificado.',
    required: false,
  })
  email_verified?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'URL de la foto de perfil del usuario.',
    nullable: true,
    required: false,
  })
  picture?: string | null;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'ID del rol del usuario.',
    nullable: true,
    required: false,
  })
  role_id?: string | null;
}
