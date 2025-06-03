import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsUUID,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
