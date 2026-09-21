import { DataSource } from 'typeorm';

for (const v of [
  'DATABASE_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DATABASE_NAME',
  'DATABASE_PORT',
]) {
  if (!process.env[v]) throw new Error(`Missing required env var: ${v}`);
}
export const SeedingDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE_NAME,
  migrations: [],
  entities: ['src/**/*.entity.ts'],
});
