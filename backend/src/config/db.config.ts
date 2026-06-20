import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  databaseHost: process.env.DATABASE_HOST || 'localhost',
  databaseName: process.env.DATABASE_NAME || 'postgres',
  databasePort: parseInt(process.env.DATABASE_PORT!, 10) || 5432,
  databaseUser: process.env.DATABASE_USER || 'postgres',
  databasePassword: process.env.DATABASE_PASSWORD || 'postgres',
  databaseSynchronize: (process.env.DATABASE_SYNCHRONIZE || 'false') === 'true',
}));
