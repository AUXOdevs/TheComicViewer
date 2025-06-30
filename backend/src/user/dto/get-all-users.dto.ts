import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Define un enum para la dirección de ordenación si no lo tienes ya
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetAllUsersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Importante para transformar la cadena de consulta a número
  @ApiProperty({
    description: 'Número de página para la paginación.',
    required: false,
    default: 1,
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Importante para transformar la cadena de consulta a número
  @ApiProperty({
    description: 'Cantidad de elementos por página (máximo: 100).',
    required: false,
    default: 10,
    maximum: 100,
    example: 10,
  })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Columna por la que ordenar (ej. `created_at`, `email`, `name`, `last_login`, `role`, `is_blocked`).',
    required: false,
    default: 'created_at',
    example: 'created_at',
  })
  sortBy?: string = 'created_at'; // Default value moved here

  @IsOptional()
  @IsEnum(OrderDirection) // Usar el enum que definimos
  @ApiProperty({
    description: 'Dirección de la ordenación (`ASC` o `DESC`).',
    required: false,
    default: OrderDirection.DESC,
    enum: OrderDirection,
    example: OrderDirection.DESC,
  })
  order?: OrderDirection = OrderDirection.DESC; // Default value moved here

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean) // Importante para transformar la cadena de consulta a booleano
  @ApiProperty({
    description: 'Incluir usuarios desactivados.',
    required: false,
    default: false,
    example: false,
  })
  includeDeleted?: boolean = false;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Filtrar por Auth0 ID exacto.',
    required: false,
  })
  auth0Id?: string;

  @IsOptional()
  @IsEmail() // O IsString si prefieres una búsqueda parcial sin validación estricta de email
  @ApiProperty({
    description: 'Filtrar por email (búsqueda parcial, case-insensitive).',
    required: false,
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filtrar por nombre de rol exacto (ej. `Registrado`, `Suscrito`, `admin`).',
    required: false,
  })
  roleName?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean) // Importante para transformar la cadena de consulta a booleano
  @ApiProperty({
    description: 'Filtrar por estado de bloqueo (`true` o `false`).',
    required: false,
  })
  isBlocked?: boolean;
}
