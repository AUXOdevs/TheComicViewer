// src/admin/admin.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { User } from '../user/entities/user.entity'; // Import User entity

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User) // Inject User repository
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const user = await this.userRepository.findOne({
      where: { auth0_id: createAdminDto.user_id },
    });
    if (!user) {
      throw new BadRequestException(
        `User with ID "${createAdminDto.user_id}" not found.`,
      );
    }

    const admin = this.adminRepository.create({
      ...createAdminDto,
      user: user, // Assign the found User entity
    });
    return this.adminRepository.save(admin);
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find({ relations: ['user'] });
  }

  async findOne(admin_id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { admin_id },
      relations: ['user'],
    });
    if (!admin) {
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }
    return admin;
  }

  async update(
    admin_id: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { admin_id } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }

    if (updateAdminDto.user_id) {
      const user = await this.userRepository.findOne({
        where: { auth0_id: updateAdminDto.user_id },
      });
      if (!user) {
        throw new BadRequestException(
          `User with ID "${updateAdminDto.user_id}" not found.`,
        );
      }
      admin.user = user; // Update the User entity
    }

    Object.assign(admin, updateAdminDto); // Apply other updates
    return this.adminRepository.save(admin);
  }

  async remove(admin_id: string): Promise<void> {
    const admin = await this.adminRepository.findOne({ where: { admin_id } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID "${admin_id}" not found.`);
    }
    await this.adminRepository.remove(admin);
  }
}
