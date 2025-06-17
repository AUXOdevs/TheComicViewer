import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    console.log(
      '✅ [BACKEND] Ruta /auth/me - Usuario extraído del token:',
      req.user,
    );
    return req.user;
  }
}
