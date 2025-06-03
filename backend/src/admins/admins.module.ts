import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
// import { User } from '../user/entities/user.entity'; // Ya no es necesario importar User aquí si UserRepository lo maneja.
// Lo importante es importar el módulo.
import { AdminController } from './admins.controller';
import { AdminService } from './admins.service';
import { AdminRepository } from './admins.repository';
import { UserModule } from '../user/user.module'; // Importar UserModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]), // Solo Admin. User se provee a través de UserModule
    forwardRef(() => UserModule), // Importar UserModule y usar forwardRef
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository], // Exportar para que otros módulos (como UserModule) puedan usarlos
})
export class AdminsModule {}
