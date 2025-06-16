import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config'; // Importar ConfigService

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['debug', 'log', 'warn', 'error', 'verbose'],
  });

  // Obtener ConfigService después de crear la aplicación
  const configService = app.get(ConfigService);
  // Definir los orígenes permitidos desde variables de entorno
  const allowedOrigins =
    configService.get<string>('CORS_ALLOWED_ORIGINS')?.split(',') || [];
  const isProduction = process.env.NODE_ENV === 'production';

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- Habilitar CORS ---
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin origen (como Postman o curl)
      if (!origin) {
        return callback(null, true);
      }
      // Si estamos en desarrollo y el origen es localhost:3000 o 3001
      if (
        !isProduction &&
        (origin.includes('http://localhost:3000') ||
          origin.includes('http://localhost:3001'))
      ) {
        return callback(null, true);
      }
      // Permitir orígenes especificados en las variables de entorno para producción o entornos definidos
      if (allowedOrigins.includes(origin)) {
        Logger.log(`CORS: Origin ${origin} permitido.`);
        return callback(null, true);
      }
      // Denegar cualquier otro origen
      Logger.warn(`CORS: Origin ${origin} bloqueado por política CORS.`);
      callback(new Error('Not allowed by CORS'), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Importante para permitir que el frontend envíe cookies o cabeceras de autorización (como el token JWT)
  });
  // --- Fin Habilitar CORS ---

  const config = new DocumentBuilder()
    .setTitle('The Comic Viewer API')
    .setDescription(
      'Documentación de la API para la aplicación The Comic Viewer',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
  Logger.log(
    `Application is running on: ${await app.getUrl()}`,
    'BackendTheComicViewer',
  );
}
bootstrap();
