import {
  Controller,
  Get,
  Req, // Usamos @Req() req: Request para extraer user
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserDto } from 'src/user/dto/user.dto'; // Importar UserDto para los tipos de respuesta
import { User } from 'src/user/entities/user.entity'; // Importar la entidad User

@ApiTags('auth') // Etiqueta para agrupar en Swagger
@Controller('auth')
export class AuthController {
  // No hay constructor o servicio de Auth aquí, ya que el flujo de Auth0 se maneja en el frontend
  // y la validación del token en JwtStrategy.

  @UseGuards(JwtAuthGuard) // Esta ruta requiere un token JWT válido
  @Get('me')
  @HttpCode(HttpStatus.OK) // Retorna 200 OK
  @ApiOperation({
    summary: 'Obtener la información del perfil del usuario autenticado',
    description:
      'Retorna los datos del usuario logueado, incluyendo su rol y permisos de administrador si aplica. Requiere un token JWT válido.',
  })
  @ApiBearerAuth('JWT-auth') // Indica que esta ruta requiere un token JWT para autenticación
  @ApiResponse({
    status: 200,
    description: 'Token válido. Retorna información del usuario.',
    type: UserDto, // Define el tipo de respuesta esperada
  })
  @ApiResponse({
    status: 401,
    description:
      'No autenticado (token JWT inválido o ausente, o usuario bloqueado/desactivado).',
  })
  getProfile(@Req() req: Request): UserDto {
    // Tipamos req como Request para extraer user
    const user = req['user'] as User; // El objeto 'user' se adjunta a la request por Passport.js
    console.log(
      '✅ [BACKEND] Ruta /auth/me - Usuario extraído del token:',
      user,
    );
    // Transformar la entidad User a UserDto si es necesario, para controlar qué datos se exponen
    // return plainToInstance(UserDto, user);
    return user; // Si User y UserDto son compatibles directamente o se maneja en un interceptor
  }
}
