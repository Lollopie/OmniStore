import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';

describe('LoginController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env`, `.env.${process.env.NODE_ENV || 'test'}`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
      ],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });
  it('/login unauthorized (POST)', () => {
    return request(app.getHttpServer())
      .post('/login')
      .send({ username: 'test', password: 'password1' })
      .expect(401);
  });
  it('/register /login (POST)', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({ username: 'test', password: 'password1' })
      .expect(201);
    return request(app.getHttpServer())
      .post('/login')
      .send({ username: 'test', password: 'password1' })
      .expect(200);
  });
  it('/login (POST) - should reject username with a space', async () => {
    const invalidData = {
      username: 'te st',
      password: 'test1',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Username can only contain letters, numbers, underscores, dots, or dashes',
    );
  });
  it('/login (POST) - should reject too short username', async () => {
    const invalidData = {
      username: 'te',
      password: 'password1',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Username is too short (minimum 3 characters)',
    );
  });
  it('/login (POST) - should reject too long username', async () => {
    const invalidData = {
      username: 'testtesttesttesttesttesttesttest',
      password: 'password1',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Username is too long (maximum 30 characters)',
    );
  });
  it('/login (POST) - should reject too short auth', async () => {
    const invalidData = {
      username: 'test',
      password: 'test1',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password is too short (minimum 8 characters)',
    );
  });
  it('/login (POST) - should reject too long auth', async () => {
    const invalidData = {
      username: 'test',
      password:
        'testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttest1',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password is too long (maximum 64 characters)',
    );
  });
  it('/login (POST) - should reject auth without letter', async () => {
    const invalidData = {
      username: 'test',
      password: '12345678',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
  });
  it('/login (POST) - should reject auth without number', async () => {
    const invalidData = {
      username: 'test',
      password: 'password',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
  });
  it('/login (POST) - should reject auth with invalid character', async () => {
    const invalidData = {
      username: 'test',
      password: 'password1ç',
    };

    const response = await request(app.getHttpServer())
      .post('/login')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
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
  });
});
