import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('genres')
export class GenresController {
  @Get()
  findAll() {
    /* ... */
  }

  @Post()
  create(@Body() dto: any) {
    /* ... */
  }
}
