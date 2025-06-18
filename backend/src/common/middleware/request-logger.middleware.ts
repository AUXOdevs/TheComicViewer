import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress;
    const authorizationHeader =
      req.get('authorization') || 'No Authorization Header provided'; // ¡AÑADIDO ESTO!

    // Log al inicio de la petición, incluyendo el encabezado de autorización
    this.logger.log(
      `--> ${method} ${originalUrl} | IP: ${ip} | User-Agent: ${userAgent} | Auth: ${authorizationHeader.substring(0, 50)}...`, // Muestra solo los primeros 50 caracteres para no llenar el log
    );

    // Log al finalizar la petición
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`<-- ${method} ${originalUrl} | Status: ${statusCode}`);
    });

    next();
  }
}
