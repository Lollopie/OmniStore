import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import { createClient, RedisClientType } from 'redis';
import { DataSource } from 'typeorm';

describe('RateLimit (e2e)', () => {
  let app: NestExpressApplication;
  let configService: ConfigService;
  let redisClient: RedisClientType;
  let dataSource: DataSource;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          envFilePath: [`.env`, `.env.${process.env.NODE_ENV || 'test'}`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
      ],
      providers: [ConfigService],
    }).compile();
    configService = moduleFixture.get(ConfigService);
    redisClient = createClient({
      url: configService.get<string>('db.redisUrl'),
    });
    await redisClient.connect();
    await redisClient.flushDb();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });
  it('/healthz', async () => {
    for (let i = 0; i < configService.get<number>('db.rateLimit')!; i++) {
      await request(app.getHttpServer()).get('/healthz').expect(200);
    }
    await request(app.getHttpServer()).get('/healthz').expect(200);
  });
  it('/auth/status', async () => {
    for (let i = 0; i < configService.get<number>('db.rateLimit')!; i++) {
      await request(app.getHttpServer()).get('/auth/status').expect(401);
    }
    await request(app.getHttpServer()).get('/auth/status').expect(401);
  });
  it('/register', async () => {
    for (let i = 0; i < configService.get<number>('db.rateLimit')!; i++) {
      await request(app.getHttpServer())
        .post('/register')
        .send({ username: 'test' + i.toString(), password: 'password1' })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post('/register')
      .send({ username: 'test', password: 'password1' })
      .expect(429);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await request(app.getHttpServer())
      .post('/register')
      .send({ username: 'test', password: 'password1' })
      .expect(201);
  });
  afterEach(async () => {
    const entities = dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tableNames.length > 0) {
      // TRUNCATE empties the tables, RESTART IDENTITY resets IDs to 1, CASCADE handles foreign keys
      await dataSource.query(
        `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
      );
    }
    await app.close();
    redisClient.destroy();
  });
});
