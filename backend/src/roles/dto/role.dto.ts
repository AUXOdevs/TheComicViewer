import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @IsUUID()
  @ApiProperty({ description: 'ID único del rol.' })
  role_id: string;

  @IsString()
  @ApiProperty({ description: 'Nombre del rol.' })
  name: string;

  // No incluimos 'users: User[]' aquí para evitar dependencias circulares
  // y una respuesta potencialmente muy grande. Si necesitas los usuarios de un rol,
  // deberías tener un endpoint separado (ej. GET /roles/:id/users).
}
