// backend/src/initial-superadmin/super-admin.service.ts
import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'; // Asegúrate de importar todas las excepciones usadas
import { DataSource } from 'typeorm';
import { UserService } from '../user/user.service';
import { RolesRepository } from '../roles/roles.repository';
import { AdminService } from '../admins/admins.service';
import {
  AUTH0_SUPERADMIN_ID,
  SUPERADMIN_EMAIL,
  SUPERADMIN_NAME,
} from './initial-superadmin.constants';
import { Role } from '../roles/entities/role.entity';
import { User } from '../user/entities/user.entity'; // Asegúrate de importar User

@Injectable()
export class SuperadminService {
  private readonly logger = new Logger(SuperadminService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly rolesRepository: RolesRepository,
    private readonly userService: UserService,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,
  ) {}

  // Este método se ejecuta cuando el módulo se inicializa
  async onModuleInit() {
    // Pequeño retraso para dar tiempo a que TypeORM se conecte y las tablas se sincronicen
    // Esto es especialmente útil si `synchronize: true` está en tu configuración de TypeORM
    setTimeout(() => this.createInitialSuperadmin(), 5000); // 5 segundos de retraso
  }

  private async createInitialSuperadmin() {
    this.logger.log(
      'Iniciando proceso de creación/verificación del superadmin inicial...',
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Asegurar que los roles existen (Registrado, superadmin, admin)
      let registradoRole = await this.rolesRepository.findByName(
        'Registrado',
        queryRunner.manager, // Pasa el manager para transaccionalidad
      );
      if (!registradoRole) {
        registradoRole = queryRunner.manager.create(Role, {
          name: 'Registrado',
        });
        await queryRunner.manager.save(registradoRole);
        this.logger.log('Rol "Registrado" creado.');
      }

      let superadminRole = await this.rolesRepository.findByName(
        'superadmin',
        queryRunner.manager, // Pasa el manager
      );
      if (!superadminRole) {
        superadminRole = queryRunner.manager.create(Role, {
          name: 'superadmin',
        });
        await queryRunner.manager.save(superadminRole);
        this.logger.log('Rol "superadmin" creado.');
      }

      let adminRole = await this.rolesRepository.findByName(
        'admin',
        queryRunner.manager, // Pasa el manager
      );
      if (!adminRole) {
        adminRole = queryRunner.manager.create(Role, { name: 'admin' });
        await queryRunner.manager.save(adminRole);
        this.logger.log('Rol "admin" creado.');
      }

      // 2. Encontrar o crear/actualizar el usuario superadmin en la tabla 'users'
      let superadminUser: User | null = await queryRunner.manager
        .getRepository(User)
        .findOne({
          where: { auth0_id: AUTH0_SUPERADMIN_ID },
          relations: ['role'], // Cargar la relación de rol
          withDeleted: true, // Incluir usuarios soft-deleted para reactivar
        });

      if (!superadminUser) {
        this.logger.log(
          `Usuario superadmin con Auth0 ID "${AUTH0_SUPERADMIN_ID}" no encontrado. Creando...`,
        );
        superadminUser = queryRunner.manager.create(User, {
          auth0_id: AUTH0_SUPERADMIN_ID,
          email: SUPERADMIN_EMAIL,
          name: SUPERADMIN_NAME,
          email_verified: true,
          picture: null, // Asegúrate de que picture pueda ser null
          role: superadminRole,
          role_id: superadminRole.role_id,
          last_login: new Date(),
          created_at: new Date(),
          is_blocked: false,
          deleted_at: null,
        });
        await queryRunner.manager.save(superadminUser);
        this.logger.log(
          `Usuario superadmin ${SUPERADMIN_EMAIL} creado exitosamente.`,
        );
      } else {
        this.logger.log(`Usuario superadmin ${SUPERADMIN_EMAIL} encontrado.`);
        let needsUpdate = false;
        // Reactivar si está soft-deleted
        if (superadminUser.deleted_at) {
          superadminUser.deleted_at = null;
          needsUpdate = true;
          this.logger.log(`Usuario superadmin ${SUPERADMIN_EMAIL} reactivado.`);
        }
        // Actualizar rol si no es 'superadmin' o si el ID de rol no coincide
        if (
          superadminUser.role?.name !== 'superadmin' ||
          superadminUser.role_id !== superadminRole.role_id
        ) {
          superadminUser.role = superadminRole;
          superadminUser.role_id = superadminRole.role_id;
          needsUpdate = true;
          this.logger.log(
            `Rol del usuario superadmin ${SUPERADMIN_EMAIL} actualizado a 'superadmin'.`,
          );
        }
        // Actualizar otros campos si es necesario
        if (superadminUser.name !== SUPERADMIN_NAME) {
          superadminUser.name = SUPERADMIN_NAME;
          needsUpdate = true;
        }
        if (superadminUser.email !== SUPERADMIN_EMAIL) {
          superadminUser.email = SUPERADMIN_EMAIL;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await queryRunner.manager.save(superadminUser);
          this.logger.log(
            `Usuario superadmin ${SUPERADMIN_EMAIL} actualizado en DB.`,
          );
        }
      }

      // 3. Asegurar que el superadmin tiene permisos de admin en la tabla 'admins'
      let adminEntryForSuperadmin =
        await this.adminService.findByUserIdInternal(AUTH0_SUPERADMIN_ID);

      if (!adminEntryForSuperadmin) {
        this.logger.log(
          `Entrada de admin para superadmin no encontrada. Creando...`,
        );
        // Llama a adminService.create pasando el queryRunner
        await this.adminService.create(
          {
            user_id: AUTH0_SUPERADMIN_ID,
            content_permission: true,
            user_permission: true,
            moderation_permission: true,
          },
          queryRunner, // Pasa el queryRunner al método create del AdminService
        );
        this.logger.log(
          `Entrada de admin para superadmin ${SUPERADMIN_EMAIL} creada exitosamente.`,
        );
      } else {
        this.logger.log(
          `Entrada de admin para superadmin ${SUPERADMIN_EMAIL} ya existe. Verificando/actualizando permisos.`,
        );
        let needsUpdate = false;
        // Asegurarse de que todos los permisos están a true
        if (!adminEntryForSuperadmin.content_permission) {
          adminEntryForSuperadmin.content_permission = true;
          needsUpdate = true;
        }
        if (!adminEntryForSuperadmin.user_permission) {
          adminEntryForSuperadmin.user_permission = true;
          needsUpdate = true;
        }
        if (!adminEntryForSuperadmin.moderation_permission) {
          adminEntryForSuperadmin.moderation_permission = true;
          needsUpdate = true;
        }

        if (needsUpdate) {
          // Guardar el adminEntryForSuperadmin usando el manager de la transacción
          await queryRunner.manager.save(adminEntryForSuperadmin);
          this.logger.log(
            `Permisos de admin para superadmin ${SUPERADMIN_EMAIL} actualizados.`,
          );
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log('Proceso de superadmin inicial completado exitosamente.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Error al crear/verificar el superadmin inicial:',
        error,
      );
      // Asegurarse de re-lanzar las excepciones si es necesario para el manejo de errores superior
      if (
        error instanceof InternalServerErrorException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during superadmin initialization.',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
