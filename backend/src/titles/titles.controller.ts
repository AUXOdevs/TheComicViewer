import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

@Controller('titles')
export class TitlesController {
  @Get()
  findAll() {
    /* ... */
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    /* ... */
  }
}
