import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

export function buildTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = config.get<string>('DATABASE_URL');
  const useSsl = parseBoolean(config.get<string>('DB_SSL'), false);

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: false,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '5432')),
    username: config.get<string>('DB_USER', 'postgres'),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.get<string>('DB_NAME', 'postgres'),
    autoLoadEntities: true,
    synchronize: false,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}
