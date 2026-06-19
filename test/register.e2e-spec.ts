import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';

describe('RegisterController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setViewEngine('hbs');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  it('/register (GET)', () => {
    return request(app.getHttpServer()).get('/register').expect(200);
  });
  it('/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/register')
      .send({ username: 'test', password: 'password1' })
      .expect(201);
  });
  it('/register (POST) - should reject username with a space', async () => {
    const invalidData = {
      username: 'te st',
      password: 'test1',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Username can only contain letters, numbers, underscores, dots, or dashes',
    );
  });
  it('/register (POST) - should reject too short username', async () => {
    const invalidData = {
      username: 'te',
      password: 'password1',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Username is too short (minimum 3 characters)',
    );
  });
  it('/register (POST) - should reject too long username', async () => {
    const invalidData = {
      username: 'testtesttesttesttesttesttesttest',
      password: 'password1',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Username is too long (maximum 30 characters)',
    );
  });
  it('/register (POST) - should reject too short password', async () => {
    const invalidData = {
      username: 'test',
      password: 'test1',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password is too short (minimum 8 characters)',
    );
  });
  it('/register (POST) - should reject too long password', async () => {
    const invalidData = {
      username: 'test',
      password:
        'testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttest1',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password is too long (maximum 64 characters)',
    );
  });
  it('/register (POST) - should reject password without letter', async () => {
    const invalidData = {
      username: 'test',
      password: '12345678',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
  });
  it('/register (POST) - should reject password without number', async () => {
    const invalidData = {
      username: 'test',
      password: 'password',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(invalidData)
      .expect(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
  });
  it('/register (POST) - should reject password with invalid character', async () => {
    const invalidData = {
      username: 'test',
      password: 'password1ç',
    };

    const response = await request(app.getHttpServer())
      .post('/register')
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
