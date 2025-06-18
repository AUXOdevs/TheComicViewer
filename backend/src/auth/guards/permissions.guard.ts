import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  AdminPermission,
} from '../decorators/permissions.decorator';
import { User } from 'src/user/entities/user.entity'; // Importa la entidad User para el tipo

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      AdminPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.debug(
        'PermissionsGuard: No se requieren permisos específicos. Acceso permitido.',
      );
      return true;
    }

    // --- MODIFICACIÓN AQUÍ para tipar explícitamente el usuario ---
    // Obtener la Request y asegurarse de que el objeto 'user' dentro de ella sea del tipo User
    const request = context.switchToHttp().getRequest();
    const user: User = request.user; // Ahora 'User' se usa explícitamente para el tipo

    this.logger.debug(
      `PermissionsGuard: Permisos requeridos para la ruta: [${requiredPermissions.join(', ')}]`,
    );

    if (!user || !['admin', 'superadmin'].includes(user.role?.name)) {
      this.logger.warn(
        `PermissionsGuard: Usuario '${user?.email || 'N/A'}' con rol '${user?.role?.name || 'N/A'}' no tiene el rol 'admin' o 'superadmin'. Acceso denegado.`,
      );
      throw new ForbiddenException(
        'You do not have the necessary role to access this resource.',
      );
    }

    const userAdminPermissions = user.admin;
    if (!userAdminPermissions) {
      this.logger.warn(
        `PermissionsGuard: Usuario '${user.email}' tiene rol '${user.role?.name}' pero no tiene una entrada en la tabla 'admins'.`,
      );
      throw new ForbiddenException(
        'Admin permissions not configured for this user.',
      );
    }

    const hasAllRequiredPermissions = requiredPermissions.every(
      (permission) => {
        const hasPermission = userAdminPermissions[permission] === true;
        if (!hasPermission) {
          this.logger.warn(
            `PermissionsGuard: Usuario '${user.email}' NO tiene el permiso requerido: '${permission}'.`,
          );
        }
        return hasPermission;
      },
    );

    if (hasAllRequiredPermissions) {
      this.logger.debug(
        `PermissionsGuard: Usuario '${user.email}' tiene todos los permisos requeridos. Acceso permitido.`,
      );
    } else {
      this.logger.warn(
        `PermissionsGuard: Usuario '${user.email}' NO tiene todos los permisos requeridos. Acceso denegado.`,
      );
      throw new ForbiddenException(
        'You do not have sufficient permissions to perform this action.',
      );
    }

    return hasAllRequiredPermissions;
  }
}
