import { PartialType } from '@nestjs/swagger';
import { CreateRatingDto } from './create-rating.dto';
import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Override 'score' to make it required for an update and apply min/max
export class UpdateRatingDto extends PartialType(CreateRatingDto) {
  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: 'Nueva puntuación de la calificación (entre 1 y 5).',
    minimum: 1,
    maximum: 5,
  })
  score: number;
}
