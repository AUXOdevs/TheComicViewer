import { Injectable } from '@nestjs/common';
import { CreateTitleGenreDto } from './dto/create-title-genre.dto';
import { UpdateTitleGenreDto } from './dto/update-title-genre.dto';

@Injectable()
export class TitleGenreService {
  create(createTitleGenreDto: CreateTitleGenreDto) {
    return 'This action adds a new titleGenre';
  }

  findAll() {
    return `This action returns all titleGenre`;
  }

  findOne(id: number) {
    return `This action returns a #${id} titleGenre`;
  }

  update(id: number, updateTitleGenreDto: UpdateTitleGenreDto) {
    return `This action updates a #${id} titleGenre`;
  }

  remove(id: number) {
    return `This action removes a #${id} titleGenre`;
  }
}
