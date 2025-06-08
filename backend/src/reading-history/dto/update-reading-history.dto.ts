import { PartialType } from '@nestjs/swagger';
import { CreateReadingHistoryDto } from './create-reading-history.dto';
import { IsNumber, Min, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReadingHistoryDto extends PartialType(
  CreateReadingHistoryDto,
) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Última página leída actualizada.',
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
}
