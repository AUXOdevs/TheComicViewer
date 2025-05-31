import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';

@Controller('comments')
export class CommentsController {
  @Get()
  findAll() {
    /* ... */
  }

  @Post()
  create(@Body() dto: any) {
    /* ... */
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    /* ... */
  }
}
