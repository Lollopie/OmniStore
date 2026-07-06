import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  databaseHost: process.env.DATABASE_HOST || 'localhost',
  databaseName: process.env.DATABASE_NAME || 'postgres',
  databasePort: parseInt(process.env.DATABASE_PORT!, 10) || 5432,
  databaseUser: process.env.APP_USER || 'postgres',
  databasePassword: process.env.APP_PASSWORD || 'postgres',
  databaseSynchronize: (process.env.DATABASE_SYNCHRONIZE || 'false') === 'true',
  redisURL: process.env.REDIS_URL || 'localhost',
  rateLimit: parseInt(process.env.RATE_LIMIT!, 10) || 10,
  rateTimeout: parseInt(process.env.RATE_TIMEOUT!, 10) || 60000,
}));
