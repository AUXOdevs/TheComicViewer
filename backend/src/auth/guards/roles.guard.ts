import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
// import { User } from 'src/user/entities/user.entity'; // Ya no es necesario importar si solo se usa 'user' del request

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      this.logger.debug(
        'RolesGuard: No se requieren roles específicos para esta ruta. Acceso permitido.',
      );
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    this.logger.debug(
      `RolesGuard: Roles requeridos: [${requiredRoles.join(', ')}]`,
    );

    if (!user || !user.role || !user.role.name) {
      this.logger.warn(
        `RolesGuard: Usuario "${user?.email}" no tiene rol definido o no está autenticado.`,
      );
      return false; // Usuario no tiene rol definido
    }

    const hasRole = requiredRoles.some((role) => user.role.name === role);
    if (hasRole) {
      this.logger.debug(
        `RolesGuard: Usuario "<span class="math-inline">\{user\.email\}" con rol "</span>{user.role.name}" tiene acceso. `,
      );
    } else {
      this.logger.warn(
        `RolesGuard: Usuario "<span class="math-inline">\{user\.email\}" con rol "</span>{user.role.name}" NO tiene los roles requeridos.`,
      );
    }

    return hasRole;
  }
}
