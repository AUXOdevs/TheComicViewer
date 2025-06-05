import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Importa SwaggerModule y DocumentBuilder

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- 1. Habilitar Global Prefix ---
  app.setGlobalPrefix('api'); // Todas tus rutas ahora serán /api/users, /api/auth, etc.

  // --- 2. Habilitar la validación y transformación de DTOs ---
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

  // --- 3. Configurar Swagger ---
  const config = new DocumentBuilder()
    .setTitle('The Comic Viewer API')
    .setDescription(
      'Documentación de la API para la aplicación The Comic Viewer',
    )
    .setVersion('1.0')
    .addBearerAuth(
      // Añade soporte para JWT (Bearer token)
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth', // Nombre para referenciar este esquema de seguridad en las operaciones
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Swagger UI estará en /api/docs

  // -------------------------------------------------------------------------

  await app.listen(3000);
}
bootstrap();
