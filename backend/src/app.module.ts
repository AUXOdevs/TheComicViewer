// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { RolesModule } from './roles/roles.module';
import { TitlesModule } from './titles/titles.module';
import { ChaptersModule } from './chapters/chapters.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CommentsModule } from './comments/comments.module';
import { RatingsModule } from './ratings/ratings.module';
import { AdminsModule } from './admins/admins.module';
import { GenresModule } from './genres/genres.module';
import { TitleGenreModule } from './title-genre/title-genre.module';
import { ReadingHistoryModule } from './reading-history/reading-history.module';

// --- ¡Nuevas importaciones necesarias! ---
import { ConfigModule, ConfigService } from '@nestjs/config'; // Para cargar la configuración
import { TypeOrmModule } from '@nestjs/typeorm'; // Para la conexión TypeORM
import typeorm from './config/typeorm';
// import typeormConfig from '../config/typeorm'; // <-- ¡Importa tu configuración de TypeORM!
// Asegúrate de que las entidades también se puedan importar aquí si no usas autoLoadEntities
// import { User } from './user/entities/user.entity';
// import { Role } from './roles/entities/role.entity';
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

// ... etc.

@Module({
  imports: [
    // --- ¡Configura NestJS Config primero! ---
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigService esté disponible globalmente
      load: [typeorm], // Carga tu configuración de TypeORM registrada
      envFilePath: '.env', // Ruta a tu archivo .env
    }),

    // --- ¡Configura TypeORM Module después! ---
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Necesita ConfigModule para acceder a ConfigService
      useFactory: (configService: ConfigService) => {
        // Accede a la configuración de TypeORM que cargaste
        const dbConfig = configService.get('typeorm');
        return {
          ...dbConfig,
          // `entities` aquí es crucial. Si usas 'dist/**/*.entity{.ts,.js}'
          // asegúrate de que tus entidades estén compiladas o que la ruta sea correcta para TS (src)
          // Un enfoque común para desarrollo es:
          entities: [__dirname + '/**/*.entity{.ts,.js}'], // Busca entidades en la carpeta `src` (en desarrollo)
          // Si ejecutas desde `dist` en producción, `dbConfig.entities` ya sería 'dist/**/*.entity{.ts,.js}'
          // Asegúrate de que `synchronize: true` SOLO en desarrollo.
          // Para producción, se usa `synchronize: false` y migraciones.
        };
      },
      inject: [ConfigService], // Inyecta ConfigService en useFactory
    }),

    // --- Tus módulos de características existentes ---
    UserModule,
    RolesModule,
    TitlesModule,
    ChaptersModule,
    FavoritesModule,
    CommentsModule,
    RatingsModule,
    AdminsModule,
    GenresModule,
    TitleGenreModule,
    ReadingHistoryModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // Implementa NestModule
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware) // Aplica tu middleware
      .forRoutes('*'); // A todas las rutas
  }
}
