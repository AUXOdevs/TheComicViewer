import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { Role } from '../roles/entities/role.entity';
import { RolesRepository } from '../roles/roles.repository';
import { AdminsModule } from '../admins/admins.module'; // Mantener por la inyección de AdminService en UserService
import { AuthModule } from 'src/auth/auth.module'; // Mantener si otras partes de Auth aún dependen de UserModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    forwardRef(() => AdminsModule), // Necesario para la inyección de AdminService en UserService
    AuthModule, // Asegura que las dependencias de Auth estén disponibles si se usan en otros módulos
  ],
  controllers: [UsersController],
  providers: [UserService, UserRepository, RolesRepository],
  exports: [UserService, UserRepository, TypeOrmModule], // Exporta UserService para JwtStrategy y otros módulos
})
export class UserModule {}
