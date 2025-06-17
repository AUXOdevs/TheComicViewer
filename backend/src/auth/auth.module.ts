import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; 
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    forwardRef(() => UserModule),
    PassportModule.register({ defaultStrategy: 'jwt' }), // Registra el default jwt strategy
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
