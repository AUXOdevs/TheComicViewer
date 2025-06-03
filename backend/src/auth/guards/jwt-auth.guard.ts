import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../../user/user.service'; // Ajusta la ruta

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(forwardRef(() => UserService)) // Inyectar UserService
    private readonly userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Llama a la estrategia 'jwt' de Passport para validar el token
    const baseActivation = await super.canActivate(context);
    if (!baseActivation) {
      return false; // El token no es válido o hay otro error de Passport
    }

    const request = context.switchToHttp().getRequest();
    // request.user ahora contiene el objeto retornado por el método `validate` de JwtStrategy
    const dbUser = request.user; // Ya tiene el usuario completo validado por JwtStrategy

    // Las validaciones de deleted_at y is_blocked ya se realizan en JwtStrategy.validate
    // Este guard simplemente usa el resultado. Si la estrategia lanzó una excepción,
    // ya habría sido atrapada y el flujo no llegaría aquí con un token inválido.

    // Si `validate` en `JwtStrategy` ya sobrescribe `request.user` con la entidad `User` completa
    // (incluyendo deleted_at y is_blocked), entonces la lógica aquí es más simple.
    // Si `validate` solo devuelve el payload, esta lógica sería más crucial aquí.
    // Para evitar redundancia, nos basamos en que `JwtStrategy.validate` ya enriqueció `request.user`.

    // Si por alguna razón quisieras re-chequear aquí:
    if (!dbUser || dbUser.deleted_at || dbUser.is_blocked) {
      // Esto solo se activaría si JwtStrategy no lanzó la excepción, lo cual sería un error
      // en el flujo. Lo ideal es que JwtStrategy ya gestione estos casos.
      throw new UnauthorizedException('User account status invalid.');
    }

    return true; // El usuario es válido y activo
  }

  // Puedes personalizar el manejo de errores aquí si es necesario
  handleRequest(err, user, info) {
    if (err || !user) {
      // Si `user` es `false` o `null` significa que `canActivate` no retornó true,
      // o que la estrategia `jwt` original de Passport falló.
      // La excepción ya fue lanzada por `JwtStrategy` o `canActivate` si el usuario no es válido.
      throw (
        err ||
        new UnauthorizedException(info?.message || 'Authentication failed')
      );
    }
    return user; // Retorna el usuario validado
  }
}
