import { PartialType } from '@nestjs/mapped-types';
import { CreateTitleGenreDto } from './create-title-genre.dto';

export class UpdateTitleGenreDto extends PartialType(CreateTitleGenreDto) {}
