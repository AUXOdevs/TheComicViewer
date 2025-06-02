// src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Admin } from './entities/admin.entity';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async create(@Body() createAdminDto: CreateAdminDto): Promise<Admin> {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  async findAll(): Promise<Admin[]> {
    return this.adminService.findAll();
  }

  @Get(':admin_id')
  async findOne(@Param('admin_id') admin_id: string): Promise<Admin> {
    return this.adminService.findOne(admin_id);
  }

  @Patch(':admin_id')
  async update(
    @Param('admin_id') admin_id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    return this.adminService.update(admin_id, updateAdminDto);
  }

  @Delete(':admin_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('admin_id') admin_id: string): Promise<void> {
    await this.adminService.remove(admin_id);
  }
}
