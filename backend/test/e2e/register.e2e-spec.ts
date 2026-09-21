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
import { AuthService } from '../../src/auth/auth.service';
import { UserEntity } from '../../src/user/user.entity';
import { getLatestEmailFor } from './utils/helper';
import fetch from 'nodemailer/lib/fetch';

@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('Register (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
      ],
      providers: [AuthService],
    })
      .overrideProvider(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    authService = moduleFixture.get(AuthService);
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
  it('/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/register')
      .send({ email: 'test@example.org' });
    expect(response.status).toBe(201);
  });
  it('should verify the token sent in the email', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({ email: 'test@example.org' })
      .expect(201);
    const verificationToken: string = (
      await getLatestEmailFor('test@example.org')
    )['HTML']
      .split('token=')[1]
      .split('"')[0];
    const response = await request(app.getHttpServer())
      .get('/register/verify?token=' + verificationToken)
      .expect(200);
    expect(response.body).toEqual({
      valid: true,
      email: 'test@example.org',
    });
  });
  it('/register (POST) - auth should not be stored in plain text', async () => {
    const userData = {
      username: 'test',
      password: 'password1',
    };

    const response = await register(userData.username, userData.password);
    expect(response.status).toBe(201);
    const user = await dataSource
      .getRepository('user')
      .findOneBy({ username: 'test' });
    expect(user).toBeDefined();
    expect(user.password).not.toBe('password1');
  });
  it('/register (POST) - auth should be verifiable', async () => {
    const userData = {
      username: 'test',
      password: 'password1',
    };

    const response = await register(userData.username, userData.password);
    expect(response.status).toBe(201);

    const user = await dataSource
      .getRepository(UserEntity)
      .findOneBy({ username: 'test' });
    expect(user).toBeDefined();
    expect(typeof user['password'] === 'string').toBeTruthy();
    const isMatch = await authService.verifyPassword(
      userData.password,
      user.password,
    );
    expect(isMatch).toBe(true);
  });
  it('/register (POST) - should reject duplicate usernames', async () => {
    const userData = {
      username: 'test',
      password: 'password1',
    };

    const response1 = await register(userData.username, userData.password);
    expect(response1.status).toBe(201);

    const response2 = await register(
      userData.username,
      userData.password,
      'test2@example.org',
    );
    expect(response2.status).toBe(400);
    const body = response2.body as { message: string | string[] };
    expect(body.message).toContain('User with this username already exists');
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
    fetch('http://localhost:8025/api/v1/messages', {
      method: 'DELETE',
    });
  });
  afterAll(async () => {
    await app.close();
  });
});
