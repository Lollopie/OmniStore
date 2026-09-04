import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from '../src/auth/auth.service';
import { MailService } from '../src/mail/mail.service';

@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('RegisterController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  const mockMailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendInviteEmail: jest.fn().mockResolvedValue(true),
  };
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
      .overrideProvider(MailService)
      .useValue(mockMailService)
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const verificationToken: string =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mockMailService.sendVerificationEmail.mock.calls[
        mockMailService.sendVerificationEmail.mock.calls.length - 1
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ][1].verificationUrl.split(
        'token=',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      )[1];
    return await request(app.getHttpServer())
      .post('/organizations/register?token=' + verificationToken)
      .send({
        ownerEmail: email,
        ownerUsername: username,
        ownerPassword: password,
        name: 'testOrg',
      });
  }
  // it('/register (GET)', () => {
  //   return request(app.getHttpServer()).get('/register').expect(200);
  // });
  it('/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/register')
      .send({ email: 'test@example.org' })
      .expect(201);
  });
  it('/register (POST) - should reject username with a space', async () => {
    const invalidData = {
      username: 'te st',
      password: 'test1',
    };
    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
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

    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
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

    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Username is too long (maximum 30 characters)',
    );
  });
  it('/register (POST) - should reject too short auth', async () => {
    const invalidData = {
      username: 'test',
      password: 'test1',
    };

    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password is too short (minimum 8 characters)',
    );
  });
  it('/register (POST) - should reject too long auth', async () => {
    const invalidData = {
      username: 'test',
      password:
        'testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttest1',
    };

    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password is too long (maximum 64 characters)',
    );
  });
  it('/register (POST) - should reject auth without letter', async () => {
    const invalidData = {
      username: 'test',
      password: '12345678',
    };

    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
  });
  it('/register (POST) - should reject auth without number', async () => {
    const invalidData = {
      username: 'test',
      password: 'password',
    };

    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
  });
  it('/register (POST) - should reject auth with invalid character', async () => {
    const invalidData = {
      username: 'test',
      password: 'password1ç',
    };

    const response = await register(invalidData.username, invalidData.password);
    expect(response.status).toBe(400);
    const body = response.body as { message: string | string[] };
    expect(body.message).toContain(
      'Password must contain a letter, a number, and can include spaces and special characters',
    );
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
    if (user) {
      expect(user.password).not.toBe('password1');
    }
  });
  it('/register (POST) - auth should be verifiable', async () => {
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
    if (user && typeof user['password'] === 'string') {
      const isMatch = await authService.verifyPassword(
        userData.password,
        user.password,
      );
      expect(isMatch).toBe(true);
    } else {
      expect(true).toBe(false);
    }
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
  });
  afterAll(async () => {
    await app.close();
  });
});
