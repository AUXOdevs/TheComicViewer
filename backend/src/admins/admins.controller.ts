import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';

@Controller('admins')
export class AdminsController {
  @Get()
  findAll() {
    /* ... */
  }

  @Post()
  create(@Body() dto: any) {
    /* ... */
  }

  @Patch(':id/permissions')
  updatePermissions(@Param('id') id: string, @Body() dto: any) {
    /* ... */
  }
}
