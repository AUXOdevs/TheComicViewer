// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { Role } from '../roles/entities/role.entity'; // Asegúrate de importar Role
import { RolesRepository } from '../roles/roles.repository';
import { AdminsModule } from '../admins/admins.module';
import { AuthModule } from 'src/auth/auth.module'; // Importa AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]), // Asegúrate de que Role esté aquí si RolesRepository lo usa
    forwardRef(() => AdminsModule),
    AuthModule, // Importa AuthModule para dependencias de Auth
  ],
  controllers: [UsersController],
  providers: [
    UserService,
    UserRepository,
    RolesRepository, // Asegúrate de que RolesRepository esté aquí si es usado
  ],
  exports: [UserService, UserRepository, TypeOrmModule], // Exporta UserService para JwtStrategy
})
export class UserModule {}
