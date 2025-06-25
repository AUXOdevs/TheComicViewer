import { PartialType } from '@nestjs/swagger';
import { CreateReadingHistoryDto } from './create-reading-history.dto';
import { IsNumber, Min, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReadingHistoryDto extends PartialType(
  CreateReadingHistoryDto,
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'ID del título (no debería cambiarse en una actualización).',
    required: false,
    readOnly: true, // Marcar como solo lectura en Swagger
  })
  title_id?: string; // Hacerlo opcional para actualizaciones, no se debe cambiar

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'ID del capítulo (no debería cambiarse en una actualización).',
    required: false,
    readOnly: true, // Marcar como solo lectura en Swagger
  })
  chapter_id?: string; // Hacerlo opcional para actualizaciones, no se debe cambiar

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Última página leída actualizada (opcional).',
    nullable: true,
    required: false,
  })
  last_page?: number | null;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el capítulo fue completado (opcional).',
    default: false,
    required: false,
  })
  completed?: boolean;
}
