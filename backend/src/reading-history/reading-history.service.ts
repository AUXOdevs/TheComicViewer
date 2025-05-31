import { Injectable } from '@nestjs/common';
import { CreateReadingHistoryDto } from './dto/create-reading-history.dto';
import { UpdateReadingHistoryDto } from './dto/update-reading-history.dto';

@Injectable()
export class ReadingHistoryService {
  create(createReadingHistoryDto: CreateReadingHistoryDto) {
    return 'This action adds a new readingHistory';
  }

  findAll() {
    return `This action returns all readingHistory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} readingHistory`;
  }

  update(id: number, updateReadingHistoryDto: UpdateReadingHistoryDto) {
    return `This action updates a #${id} readingHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} readingHistory`;
  }
}
