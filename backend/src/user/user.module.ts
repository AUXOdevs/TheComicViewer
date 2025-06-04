// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { Role } from '../roles/entities/role.entity';
import { RolesRepository } from '../roles/roles.repository';
import { AdminsModule } from '../admins/admins.module'; // Importar AdminsModule
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    forwardRef(() => AdminsModule),
    AuthModule
  ],
  controllers: [UsersController],
  providers: [
    UserService,
    UserRepository,
    RolesRepository,
  ],
  exports: [UserService, UserRepository, TypeOrmModule],
})
export class UserModule {}