// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- ¡Importa esto!

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- ¡Añade esto para habilitar la validación y transformación de DTOs! ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están definidas en el DTO
      forbidNonWhitelisted: true, // Lanza un error si hay propiedades no definidas
      transform: true, // Transforma los tipos de datos (ej. string a number, o a instancia de DTO)
      transformOptions: {
        enableImplicitConversion: true, // Opcional: convierte tipos primitivos si es posible
      },
    }),
  );
  // -------------------------------------------------------------------------

  await app.listen(3000);
}
bootstrap();
