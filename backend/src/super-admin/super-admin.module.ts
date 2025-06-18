// backend/src/initial-superadmin/super-admin.module.ts (Ahora se llama super-admin.module.ts)
import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { RolesModule } from '../roles/roles.module';
import { AdminsModule } from '../admins/admins.module';
import { SuperadminService } from './super-admin.service'; // Asegúrate de que el nombre del archivo del servicio coincida

@Module({
  imports: [RolesModule, UserModule, forwardRef(() => AdminsModule)],
  providers: [SuperadminService], // Usa el nuevo nombre del servicio
})
export class SuperadminModule {} // Usa el nuevo nombre del módulo
