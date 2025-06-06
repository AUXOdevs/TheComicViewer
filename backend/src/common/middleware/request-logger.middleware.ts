import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress;

    // Log al inicio de la petición
    this.logger.log(
      `--> ${method} ${originalUrl} | IP: ${ip} | User-Agent: ${userAgent}`,
    );

    // Log al finalizar la petición
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`<-- ${method} ${originalUrl} | Status: ${statusCode}`);
    });

    next();
  }
}
