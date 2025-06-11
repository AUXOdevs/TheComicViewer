import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
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
import typeorm from './config/typeorm';
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './settings/setting.module';
import { Setting } from './settings/entities/setting.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('typeorm');
        return {
          ...dbConfig,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          Setting,
          // Asegúrate de que synchronize: true SOLO en desarrollo
          // synchronize: process.env.NODE_ENV !== 'production', // O controla esto desde tu configuración typeorm.ts
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
