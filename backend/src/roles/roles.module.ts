// src/roles/roles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- ¡Importa TypeOrmModule!
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { User } from 'src/user/entities/user.entity';
import { RolesRepository } from './roles.repository';


@Module({
  imports: [
    // Registra las entidades que este módulo y sus servicios/repositorios usarán
    // Esto hace que los repositorios de Role y User estén disponibles para inyección
    TypeOrmModule.forFeature([Role, User]),
  ],
  controllers: [RolesController],
  providers: [
    RolesService,
    RolesRepository, // <-- ¡Asegúrate de que RolesRepository esté en los proveedores!
  ],
  // Exporta el servicio y el repositorio si otros módulos necesitan inyectarlos
  exports: [RolesService, RolesRepository, TypeOrmModule],
})
export class RolesModule {}
