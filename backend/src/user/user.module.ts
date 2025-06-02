// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { User } from './entities/user.entity'; // Import User entity
import { UserRepository } from './user.repository'; // Import UserRepository
import { Role } from '../roles/entities/role.entity'; // Import Role entity for RolesRepository
import { RolesRepository } from '../roles/roles.repository'; // Import RolesRepository

@Module({
  imports: [
    // Register entities for TypeORM within this module
    TypeOrmModule.forFeature([User, Role]), // User is needed for UserRepository, Role for RolesRepository
  ],
  controllers: [UsersController],
  providers: [
    UserService,
    UserRepository, // Make UserRepository available
    RolesRepository, // Make RolesRepository available for UserService to inject
  ],
  // Export UserService and UserRepository if other modules need to inject them
  exports: [UserService, UserRepository, TypeOrmModule],
})
export class UserModule {}
