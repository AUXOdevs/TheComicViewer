import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('roles')
export class RolesController {
  @Get()
  findAll() {
    /* ... */
  }

  @Post()
  create(@Body() dto: any) {
    /* ... */
  }
}
