import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { User } from '../user/entities/user.entity';
import { AdminController } from './admins.controller';
import { AdminService } from './admins.service';
import { AdminRepository } from './admins.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, User])],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository],
})
export class AdminsModule {}
