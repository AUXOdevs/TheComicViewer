import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReadingHistoryDto {
  // user_id NO se incluye aquí, se obtendrá del token JWT o se gestionará por admins
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del capítulo leído.' })
  chapter_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0) // Puede ser 0 si empieza desde el inicio
  @ApiProperty({
    description: 'Última página leída del capítulo.',
    nullable: true,
  })
  last_page?: number | null;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el capítulo fue completado.',
    default: false,
  })
  completed?: boolean;

  // OPCIONAL: Campo para que un ADMIN especifique el usuario objetivo
  // Solo se usaría si el admin tiene permisos de user_permission y lo envía.
  // Sin embargo, para mayor seguridad y claridad, preferimos que los admins usen rutas específicas
  // o pasen el userId como parámetro de ruta, no dentro del DTO de un usuario normal.
  // Si deseas que un admin pueda especificar un user_id en el body para create/update de historial ajeno,
  // tendrías que añadirlo aquí como @IsOptional() @IsUUID() user_id?: string;
  // Por ahora, lo mantenemos simple y el user_id siempre viene del token o path.
}
