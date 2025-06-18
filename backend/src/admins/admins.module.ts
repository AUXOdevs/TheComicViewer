import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminController } from './admins.controller';
import { AdminService } from './admins.service';
import { AdminRepository } from './admins.repository';
import { UserModule } from '../user/user.module';
import { RolesModule } from '../roles/roles.module'; // ¡IMPORTADO!

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    forwardRef(() => UserModule),
    RolesModule, // <-- ¡AÑADIDO ESTO! Ahora AdminService puede ver RolesRepository
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository],
})
export class AdminsModule {}
