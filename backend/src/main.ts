import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common'; // Mantener Logger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Configuración del logger para mostrar diferentes niveles en desarrollo y producción
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['debug', 'log', 'warn', 'error', 'verbose'],
  });

  // Establecer un prefijo global para todas las rutas API
  app.setGlobalPrefix('api');

  // Aplicar el filtro de excepciones globalmente
  app.useGlobalFilters(new HttpExceptionFilter()); // Añadir esta línea

  // Configuración global para la validación de DTOs (Data Transfer Objects)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Asegura que solo las propiedades definidas en los DTOs sean aceptadas
      forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no definidas
      transform: true, // Transforma automáticamente los payloads a instancias de los DTOs
      transformOptions: {
        enableImplicitConversion: true, // Permite conversiones implícitas de tipos (ej. string a number)
      },
    }),
  );

  // --- Configuración de CORS (Cross-Origin Resource Sharing) ---
  // Permite solicitudes desde el frontend (localhost:3000) y Postman/Swagger
  // En producción, aquí irían los dominios de tu frontend desplegado
  app.enableCors({
    origin: [
      'http://localhost:3000', // Tu frontend en desarrollo
      'http://localhost:3001', // Swagger UI si corre en el mismo puerto que el backend
      // 'https://thecomicviewer.onrender.com', // Ejemplo de tu dominio de frontend en producción
      // 'https://api.thecomicviewer.onrender.com', // Ejemplo de tu dominio de backend en producción
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    credentials: true, // Importante para permitir el envío de cookies o encabezados de autorización (como el token JWT)
  });
  // --- Fin Configuración de CORS ---

  // --- Configuración de Swagger (Documentación de la API) ---
  const config = new DocumentBuilder()
    .setTitle('The Comic Viewer API')
    .setDescription(
      'Documentación de la API para la aplicación The Comic Viewer',
    )
    .setVersion('1.0')
    .addBearerAuth(
      // Define un esquema de seguridad para JWT (Bearer Token)
      {
        type: 'http', // Tipo de esquema de seguridad
        scheme: 'bearer', // Esquema HTTP para tokens
        bearerFormat: 'JWT', // Formato específico del token
        name: 'JWT', // Nombre que aparecerá en la UI de Swagger
        description: 'Ingresa el token JWT (Bearer Token)', // Descripción para el usuario
        in: 'header', // Indica que el token se envía en el encabezado de la petición
      },
      'JWT-auth', // Un ID único para referenciar este esquema en los decoradores @ApiBearerAuth
    )
    .build();

  // Crea el documento de Swagger a partir de la aplicación y la configuración
  const document = SwaggerModule.createDocument(app, config);
  // Monta la UI de Swagger en la ruta '/api/docs'
  SwaggerModule.setup('api/docs', app, document); // Ahora la documentación estará en http://localhost:3001/api/docs
  // --- Fin Configuración de Swagger ---

  // Definir el puerto en el que la aplicación escuchará
  const port = process.env.PORT || 3001; // Usar el puerto 3001 para el backend por defecto
  await app.listen(port);
  Logger.log(
    `Application is running on: ${await app.getUrl()}`, // Obtiene la URL completa (http://[::1]:3001)
    'BackendTheComicViewer', // Contexto del logger
  );
  Logger.log(
    `Swagger documentation available at: ${await app.getUrl()}/api/docs`,
    'SwaggerUI',
  );
}
bootstrap();
