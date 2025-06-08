import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
// Ya no necesitamos: UserService, RegisterAuthDto, LoginAuthDto, UserDto, User, plainToInstance, ConflictException, UnauthorizedException, firstValueFrom

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // --- Los métodos 'register' y 'login' para usuarios finales se ELIMINAN ---
  // La autenticación ahora es gestionada por el Frontend (Next.js)
  // directamente con Auth0 (flujo de Código de Autorización con PKCE).
  // Tu backend actuará como un servidor de recursos y validará los tokens emitidos por Auth0.

  // Opcional: Método para obtener un token para la Auth0 Management API (si tu backend necesita administrar usuarios en Auth0)
  async getManagementApiToken(): Promise<string> {
    try {
      const auth0Domain = this.configService.get<string>('AUTH0_DOMAIN');
      const auth0ManagementClientId = this.configService.get<string>(
        'AUTH0_MANAGEMENT_CLIENT_ID',
      ); // Nueva variable de entorno
      const auth0ManagementClientSecret = this.configService.get<string>(
        'AUTH0_MANAGEMENT_CLIENT_SECRET',
      ); // Nueva variable de entorno
      const auth0ManagementAudience = `${auth0Domain}api/v2/`; // Audiencia de la Management API

      const response = await this.httpService
        .post(`${auth0Domain}oauth/token`, {
          client_id: auth0ManagementClientId,
          client_secret: auth0ManagementClientSecret,
          audience: auth0ManagementAudience,
          grant_type: 'client_credentials',
        })
        .toPromise(); // .toPromise() para convertir el Observable en Promise

      return response.data.access_token;
    } catch (error) {
      console.error(
        'Error getting Auth0 Management API token:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to get Auth0 Management API token.',
      );
    }
  }
}
