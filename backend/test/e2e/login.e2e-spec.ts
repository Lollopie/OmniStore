import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getLatestEmailFor } from './utils/helper';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('LoginController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
      ],
      providers: [],
    })
      .overrideProvider(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });
  async function register(username: string, password: string, email?: string) {
    email = email ? email : 'test@example.org';
    await request(app.getHttpServer())
      .post('/register')
      .send({ email: email })
      .expect(201);
    const verificationToken: string = (await getLatestEmailFor(email))['HTML']
      .split('token=')[1]
      .split('"')[0];
    return await request(app.getHttpServer())
      .post('/organizations/register?token=' + verificationToken)
      .send({
        ownerEmail: email,
        ownerUsername: username,
        ownerPassword: password,
        name: 'testOrg',
      });
  }
  it('/login unauthorized (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'test', password: 'password1' });
    expect(response.status).toBe(401);
  });
  it('/register /login (POST)', async () => {
    const loginData = {
      username: 'test',
      password: 'password1',
    };
    await register(loginData.username, loginData.password);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({ username: loginData.username, password: loginData.password });
    expect(response.status).toBe(200);
  });
  it('/login (POST) - should set cookies', async () => {
    const validData = {
      username: 'test',
      password: 'password1',
    };
    await register(validData.username, validData.password);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send(validData)
      .expect(200);
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=.+/);
    expect(cookies[0]).toMatch(/HttpOnly/);
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
  });
  afterAll(async () => {
    await app.close();
  });
});
