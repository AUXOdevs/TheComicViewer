import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDto } from '../user/dto/user.dto'; // Importar UserDto

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Registro de usuario',
    description:
      'Este endpoint permite el registro de un nuevo usuario a través de Auth0 y lo provisiona en la base de datos local.',
  })
  @ApiBody({ type: RegisterAuthDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de registro inválidos.' })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya existe (en Auth0 o localmente).',
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() registerAuthDto: RegisterAuthDto): Promise<UserDto> {
    return this.authService.register(registerAuthDto);
  }

  @ApiOperation({
    summary: 'Inicio de sesión de usuario',
    description:
      'Este endpoint permite el inicio de sesión a través de Auth0, provisiona el usuario si es nuevo/desactivado, y devuelve un token JWT de Auth0.',
  })
  @ApiBody({ type: LoginAuthDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso. Retorna token JWT.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta bloqueada/desactivada.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginAuthDto: LoginAuthDto,
  ): Promise<{ user: UserDto; accessToken: string }> {
    return this.authService.login(loginAuthDto);
  }
}
