import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; // Importa tu estrategia JWT
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // Registra la estrategia por defecto
    forwardRef(() => UserModule), // Importa UserModule con forwardRef
  ],
  providers: [
    JwtStrategy, // ¡Asegúrate de que JwtStrategy esté listada aquí como un proveedor!
  ],
  exports: [
    PassportModule, // Exporta PassportModule para que otros módulos puedan usar los guards de Passport
    JwtStrategy, // Opcional: exportar la estrategia si otros módulos la necesitan directamente (raro)
  ],
})
export class AuthModule {}
