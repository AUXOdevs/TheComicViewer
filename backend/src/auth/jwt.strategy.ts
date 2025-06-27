import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('AUTH0_AUDIENCE'),
      issuer: `https://${configService.get<string>('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get<string>(
          'AUTH0_DOMAIN',
        )}/.well-known/jwks.json`,
      }),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<User> {
    this.logger.debug('--- JwtStrategy: Iniciando validación de JWT ---');
    this.logger.debug(
      `JwtStrategy: Payload decodificado: ${JSON.stringify(payload)}`,
    );

    const auth0_id = payload.sub;
    // Ajustar cómo se obtienen estos claims. Usaré un enfoque más genérico.
    // Auth0 por defecto usa `email`, `name`, `email_verified`, `picture` en el root del payload.
    // Si usas reglas de Auth0 para añadir claims personalizados con un namespace,
    // asegúrate de que `AUTH0_NAMESPACE` esté configurado en tus variables de entorno (ej. 'https://tu-dominio.com').
    const namespace = this.configService.get<string>('AUTH0_NAMESPACE');
    const email = (namespace && payload[`${namespace}/email`]) || payload.email;
    const name =
      (namespace && payload[`${namespace}/name`]) ||
      payload.name ||
      payload.nickname;
    const emailVerified =
      (namespace && payload[`${namespace}/email_verified`]) ||
      payload.email_verified;
    const picture =
      (namespace && payload[`${namespace}/picture`]) || payload.picture;

    if (!auth0_id) {
      this.logger.error(
        'JwtStrategy: User ID (sub) no encontrado en el payload del token.',
      );
      throw new UnauthorizedException('User ID not found in token payload.');
    }
    this.logger.debug(`JwtStrategy: Auth0 ID extraído: ${auth0_id}`);

    if (payload.exp) {
      const expirationTime = new Date(payload.exp * 1000);
      const currentTime = new Date();
      const remainingTimeMs = expirationTime.getTime() - currentTime.getTime();
      const remainingMinutes = Math.floor(remainingTimeMs / (1000 * 60));
      const remainingSeconds = Math.floor(
        (remainingTimeMs % (1000 * 60)) / 1000,
      );

      this.logger.debug(
        `JwtStrategy: Token expira en: ${expirationTime.toISOString()}`,
      );
      this.logger.debug(
        `JwtStrategy: Tiempo restante del token: ${remainingMinutes} minutos y ${remainingSeconds} segundos.`,
      );
    } else {
      this.logger.warn(
        'JwtStrategy: El payload del token no contiene un campo "exp" (tiempo de expiración).',
      );
    }

    // Llama al método correcto del servicio de usuario
    const user = await this.userService.createInitialUser(
      auth0_id,
      email,
      name,
      emailVerified,
      picture,
    );

    if (!user) {
      this.logger.error(
        `JwtStrategy: Falló la creación o recuperación del usuario con Auth0 ID "${auth0_id}".`,
      );
      throw new InternalServerErrorException(
        'Failed to provision or retrieve user from database.',
      );
    }
    this.logger.debug(
      `JwtStrategy: Usuario procesado en la DB: ${user.email} (ID: ${user.auth0_id})`,
    );

    if (user.role?.name === 'admin' || user.role?.name === 'superadmin') {
      if (user.admin) {
        this.logger.debug(
          `JwtStrategy: Permisos de admin para ${user.email}: Content=${user.admin.content_permission}, User=${user.admin.user_permission}, Moderation=${user.admin.moderation_permission}`,
        );
      } else {
        this.logger.warn(
          `JwtStrategy: Usuario ${user.email} tiene rol '${user.role.name}' pero no tiene una entrada en la tabla 'admins'. Esto se resolverá con el SuperadminService al inicio.`,
        );
      }
    }

    if (user.deleted_at) {
      this.logger.warn(
        `JwtStrategy: Cuenta de usuario "${user.email}" desactivada.`,
      );
      throw new UnauthorizedException('Your account is deactivated.');
    }

    if (user.is_blocked) {
      this.logger.warn(
        `JwtStrategy: Cuenta de usuario "${user.email}" bloqueada.`,
      );
      throw new UnauthorizedException('Your account has been blocked.');
    }

    this.logger.debug(
      'JwtStrategy: Validación de JWT exitosa. Usuario activo y autorizado.',
    );
    return user;
  }
}
