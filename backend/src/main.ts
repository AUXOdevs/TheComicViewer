import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common'; // Importa Logger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Configura los niveles de log para la aplicación NestJS
    // En desarrollo, puedes usar ['debug', 'log', 'warn', 'error', 'verbose']
    // En producción, podrías usar ['error', 'warn'] o false para deshabilitar los logs de NestJS
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log'] // Solo errores, advertencias y logs generales en producción
        : ['debug', 'log', 'warn', 'error', 'verbose'], // Todos los niveles en desarrollo
  });

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
