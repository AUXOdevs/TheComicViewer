import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID, // Mantener IsUUID solo si es para role_id
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsOptional() // Hacemos auth0_id opcional aquí porque AuthService lo construirá
  @IsString() // CAMBIO CLAVE: Es un string, no un UUID
  @ApiProperty({
    description: 'ID único del usuario proporcionado por Auth0.',
    required: false,
  })
  auth0_id?: string; // Ahora es opcional en el DTO

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre completo del usuario.' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Dirección de correo electrónico única del usuario.',
  })
  email: string;

  @IsOptional() // Puede que Auth0 no siempre lo envíe o que se verifique después
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el email del usuario ha sido verificado.',
    required: false,
  })
  email_verified?: boolean; // Ahora es opcional y booleano

  @IsOptional() // La imagen de perfil puede ser opcional
  @IsString() // Puede ser string o null
  @ApiProperty({
    description: 'URL de la foto de perfil del usuario.',
    nullable: true,
    required: false,
  })
  picture?: string | null;

  // Las propiedades de contraseña no son necesarias si Auth0 gestiona las credenciales.
  // Las mantengo comentadas para referencia, si tuvieras un flujo de registro local.
  // @IsOptional()
  // @IsString()
  // @MinLength(8)
  // @MaxLength(128)
  // @ApiProperty({ description: 'Contraseña del usuario (solo si no es Auth0).', required: false })
  // password?: string;

  // @IsOptional()
  // @IsString()
  // @MinLength(8)
  // @MaxLength(128)
  // @ApiProperty({ description: 'Confirmación de contraseña (solo si no es Auth0).', required: false })
  // confirmPassword?: string;

  @IsOptional() // El rol_id es opcional si tu UserService asigna un rol por defecto
  @IsUUID()
  @ApiProperty({
    description: 'ID del rol del usuario.',
    nullable: true,
    required: false,
  })
  role_id?: string | null; // role_id puede ser string o null
}
