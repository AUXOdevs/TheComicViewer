import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserDto } from '../user/dto/user.dto';
import { User } from '../user/entities/user.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto): Promise<UserDto> {
    const { email, password, name } = registerAuthDto;

    try {
      const auth0Domain = this.configService.get<string>('AUTH0_DOMAIN');
      const auth0ClientId = this.configService.get<string>('AUTH0_CLIENT_ID');
      const auth0Connection =
        this.configService.get<string>('AUTH0_CONNECTION');

      const auth0RegisterResponse = await firstValueFrom(
        this.httpService.post(`${auth0Domain}dbconnections/signup`, {
          client_id: auth0ClientId,
          email,
          password,
          connection: auth0Connection,
          user_metadata: { name },
        }),
      );

      const auth0User = auth0RegisterResponse.data;
      console.log('Auth0 Signup Response Data:', auth0User);

      const auth0_id = auth0User._id;

      if (!auth0_id) {
        throw new InternalServerErrorException(
          'Could not retrieve Auth0 ID after registration.',
        );
      }

      const newUserInDb = await this.userService.create({
        auth0_id: `auth0|${auth0_id}`,
        email,
        name,
        email_verified: auth0User.email_verified || false,
        picture: auth0User.picture || null,
      });

      return newUserInDb;
    } catch (error) {
      if (error.response && error.response.data) {
        const auth0Error = error.response.data;
        console.error('Auth0 API Error Response:', auth0Error);
        if (auth0Error.code === 'user_exists') {
          const existingUser = await this.userService.findByEmail(email, true);
          if (existingUser && existingUser.deleted_at) {
            throw new ConflictException(
              `User with email "${email}" is deactivated. Consider reactivating.`,
            );
          }
          throw new ConflictException(
            `User with email "${email}" already exists.`,
          );
        }
        throw new BadRequestException(
          auth0Error.description || 'Auth0 registration failed.',
        );
      }
      console.error('Error during Auth0 registration:', error);
      throw new InternalServerErrorException(
        'Failed to register user due to an internal error.',
      );
    }
  }

  async login(
    loginAuthDto: LoginAuthDto,
  ): Promise<{ user: UserDto; accessToken: string }> {
    const { email, password } = loginAuthDto;

    try {
      const auth0Domain = this.configService.get<string>('AUTH0_DOMAIN');
      const auth0ClientId = this.configService.get<string>('AUTH0_CLIENT_ID');
      const auth0Audience = this.configService.get<string>('AUTH0_AUDIENCE');
      const auth0Connection =
        this.configService.get<string>('AUTH0_CONNECTION');

      const auth0LoginResponse = await firstValueFrom(
        this.httpService.post(`${auth0Domain}oauth/token`, {
          grant_type: 'password',
          username: email,
          password,
          audience: auth0Audience,
          client_id: auth0ClientId,
          // CAMBIO CLAVE: Ajustar el scope. Si definiste 'read:users', inclúyelo.
          // Siempre incluye 'openid' para obtener el id_token.
          scope: 'openid read:users', // O 'openid' si solo necesitas el id_token y no hay otros scopes definidos
          connection: auth0Connection,
        }),
      );

      const { access_token, id_token } = auth0LoginResponse.data;

      const decodedIdToken = id_token
        ? JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString())
        : null;
      const auth0_id = decodedIdToken?.sub;

      if (!auth0_id) {
        throw new InternalServerErrorException(
          'Could not retrieve Auth0 ID from token.',
        );
      }

      let userInDb: UserDto | null =
        await this.userService.findByAuth0IdForAuth(auth0_id);

      if (!userInDb) {
        userInDb = await this.userService.create({
          auth0_id: auth0_id,
          email: decodedIdToken?.email || email,
          name:
            decodedIdToken?.name ||
            decodedIdToken?.nickname ||
            email.split('@')[0],
          picture: decodedIdToken?.picture || null,
          email_verified: decodedIdToken?.email_verified || false,
        });
      } else if (userInDb.deleted_at) {
        userInDb = await this.userService.reactivateUser(auth0_id);
      } else if (userInDb.is_blocked) {
        throw new UnauthorizedException('Your account has been blocked.');
      }

      return {
        user: userInDb,
        accessToken: access_token,
      };
    } catch (error) {
      if (error.response && error.response.data) {
        const auth0Error = error.response.data;
        console.error('Auth0 API Error Response (Login):', auth0Error);
        if (
          auth0Error.error === 'invalid_grant' ||
          auth0Error.error === 'access_denied'
        ) {
          throw new UnauthorizedException('Invalid credentials.');
        }
        throw new BadRequestException(
          auth0Error.error_description || 'Auth0 login failed.',
        );
      }
      console.error('Error during Auth0 login:', error);
      throw new InternalServerErrorException(
        'Failed to login user due to an internal error.',
      );
    }
  }
}
