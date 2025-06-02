// src/config/typeorm.ts
import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm'; // Necesario para 'connectionSource' si lo usas fuera de Nest

dotenvConfig({ path: '.env' });

const config = {
  type: 'postgres',
  host: `${process.env.DB_HOST}`,
  port: parseInt(process.env.DB_PORT || '6543', 10),
  username: `${process.env.DB_USERNAME}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_DATABASE}`,
  entities: ['dist/**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: false, // <-- ¡Deja esto en `false` para producción!
  // Si necesitas `true` para desarrollo, cámbialo en `AppModule` o usa variables de entorno
  logging: false,
  ssl: {
    rejectUnauthorized: false, // Importante para Supabase
  },
};

export default registerAs('typeorm', () => config);

// Esta línea 'connectionSource' solo es necesaria si estás usando esta DataSource fuera de NestJS
// (por ejemplo, para scripts de migración directamente con TypeORM CLI).
// Para la inyección de dependencias de NestJS, no es estrictamente necesaria.
export const connectionSource = new DataSource(config as DataSourceOptions);
