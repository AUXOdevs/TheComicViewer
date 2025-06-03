import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
// import { User } from 'src/user/entities/user.entity';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No se requiere un rol específico, permitir acceso
    }

    const { user } = context.switchToHttp().getRequest();

    // Asegúrate de que user.role sea la entidad Role completa y no solo un string
    // O adapta esta lógica a cómo manejas los roles en tu entidad User
    if (!user || !user.role || !user.role.name) {
      return false; // Usuario no tiene rol definido
    }

    // Verificar si el rol del usuario está entre los roles requeridos
    return requiredRoles.some((role) => user.role.name === role);
  }
}
