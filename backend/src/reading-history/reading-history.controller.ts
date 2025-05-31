import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';

@Controller('reading-history')
export class ReadingHistoryController {
  @Get()
  findAll() {
    /* ... */
  }

  @Post()
  create(@Body() dto: any) {
    /* ... */
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    /* ... */
  }
}
