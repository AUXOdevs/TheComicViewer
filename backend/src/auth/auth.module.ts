import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importar ConfigService
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service'; // Importar AuthService
import { AuthController } from './auth.controller'; // Importar AuthController
import { HttpModule } from '@nestjs/axios'; // Importar HttpModule para peticiones HTTP

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UserModule),
    HttpModule, // Añadir HttpModule aquí
  ],
  controllers: [AuthController], // Añadir AuthController aquí
  providers: [
    AuthService, // Añadir AuthService aquí
    JwtStrategy,
  ],
  exports: [
    PassportModule,
    JwtStrategy,
    AuthService, // Exportar AuthService si otros módulos lo necesitan
  ],
})
export class AuthModule {}
