import {
  IsUUID,
  IsString,
  IsEmail,
  IsUrl,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleDto } from '../../roles/dto/role.dto'; // Asegúrate de que la ruta sea correcta

export class UserDto {
//   @IsUUID()
//   @ApiProperty({ description: 'ID único del usuario en la base de datos.' })
//   user_id: string;

  @IsUUID()
  @ApiProperty({ description: 'ID único del usuario proporcionado por Auth0.' })
  auth0_id: string;

  @IsString()
  @ApiProperty({ description: 'Nombre completo del usuario.' })
  name: string;

  @IsEmail()
  @ApiProperty({
    description: 'Dirección de correo electrónico única del usuario.',
  })
  email: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    description: 'URL de la foto de perfil del usuario.',
    nullable: true,
  })
  picture?: string;

  @IsDate()
  @ApiProperty({
    description: 'Fecha y hora del último inicio de sesión.',
    type: 'string',
    format: 'date-time',
  })
  last_login: Date;

  @IsDate()
  @ApiProperty({
    description: 'Fecha y hora de creación de la cuenta de usuario.',
    type: 'string',
    format: 'date-time',
  })
  created_at: Date;

  @IsBoolean()
  @ApiProperty({ description: 'Indica si el usuario está bloqueado.' })
  is_blocked: boolean;

  @ApiProperty({
    type: () => RoleDto,
    description: 'Información del rol del usuario.',
  })
  role: RoleDto;
}
