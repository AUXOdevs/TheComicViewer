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
import { plainToInstance } from 'class-transformer'; // Necesario para la transformación a DTO

@ApiTags('auth') // Etiqueta para agrupar en Swagger
@Controller('auth')
export class AuthController {
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
    const user = req['user'] as User;
    console.log(
      '✅ [BACKEND] Ruta /auth/me - Usuario extraído del token:',
      user,
    );
    // Transforma la entidad User a UserDto para asegurar que solo se exponen los datos deseados
    return plainToInstance(UserDto, user);
  }
}
