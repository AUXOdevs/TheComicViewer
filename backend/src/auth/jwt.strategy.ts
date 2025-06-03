import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { expressJwtSecret } from 'jwks-rsa';
import { UserService } from '../user/user.service'; // Asegúrate de que la ruta sea correcta

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => UserService)) // Inyectar UserService para validación adicional
    private readonly userService: UserService,
  ) {
    super({
      secretOrKeyProvider: expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('AUTH0_DOMAIN')}.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('AUTH0_AUDIENCE'),
      issuer: `${configService.get<string>('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
      passReqToCallback: true, // Importante para acceder al request en el validate
    });
  }

  // El payload es lo que viene decodificado del JWT
  async validate(req: Request, payload: any) {
    // 'sub' en el payload de Auth0 es el ID del usuario (ej: auth0|12345)
    const auth0_id = payload.sub;

    if (!auth0_id) {
      throw new UnauthorizedException('User ID not found in token payload.');
    }

    // Usamos findByAuth0IdForAuth que busca usuarios incluso si están soft-deleted
    const user = await this.userService.findByAuth0IdForAuth(auth0_id);

    if (!user) {
      // Si el usuario no se encuentra, es un token de un usuario que ya no existe en la DB
      throw new UnauthorizedException('User not found in database.');
    }

    // Aquí validamos los estados del usuario de nuestra base de datos
    if (user.deleted_at) {
      throw new UnauthorizedException('Your account is deactivated.');
    }

    if (user.is_blocked) {
      // Asumiendo que tienes un campo is_blocked en tu entidad User
      throw new UnauthorizedException('Your account has been blocked.');
    }

    // Sobrescribir request.user con la entidad User completa de la DB
    // Esto es lo que estará disponible en request.user en tus controladores
    // Nota: El tipo de 'req' es 'Request' de Express.
    (req as any).user = user;
    return user;
  }
}
