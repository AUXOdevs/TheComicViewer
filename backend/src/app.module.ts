// src/app.module.ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Logger,
} from '@nestjs/common';
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

import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeormConfig from './config/typeorm';
// import appConfig from './config/app.config'; // <-- ELIMINADO
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'; // <-- Nombre de archivo original
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './settings/setting.module';
import { Setting } from './settings/entities/setting.entity';
import { SuperadminModule } from './super-admin/super-admin.module';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager'; // <-- Eliminado CacheStoreFactory y redisStore

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig], // <-- Solo carga typeormConfig
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            // Usar directamente las variables de entorno para Throttler
            ttl: config.get<number>('THROTTLE_TTL', 60),
            limit: config.get<number>('THROTTLE_LIMIT', 10),
          },
        ],
      }),
    }),
    CacheModule.register({
      ttl: 10 * 60 * 1000, // 10 minutos de caché por defecto (en milisegundos)
      max: 100, // Número máximo de elementos en caché
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('typeorm');
        return {
          ...dbConfig,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          Setting,
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    RolesModule,
    AdminsModule,
    AuthModule,
    TitlesModule,
    ChaptersModule,
    FavoritesModule,
    CommentsModule,
    RatingsModule,
    GenresModule,
    TitleGenreModule,
    ReadingHistoryModule,
    SettingsModule,
    DatabaseModule,
    SuperadminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
