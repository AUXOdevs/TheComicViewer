import { Controller, Post, Delete, Param, Body } from '@nestjs/common';

@Controller('title-genre')
export class TitleGenreController {
  @Post()
  create(@Body() dto: any) {
    /* ... */
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    /* ... */
  }
}
