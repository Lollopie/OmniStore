import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({
  path: [`.env.${process.env.NODE_ENV || 'dev'}`, `.env`, '/etc/secrets/.env'],
});

export const MigrationDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.MIGRATOR_USER,
  password: process.env.MIGRATOR_PASSWORD,
  database: process.env.DATABASE_NAME,
  migrations: ['dist/migrations/*.js'],
  entities: ['dist/**/*.entity.js'],
});
