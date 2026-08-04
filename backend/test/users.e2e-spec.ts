import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { PasswordService } from '../src/auth/password.service';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';

@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('UsersController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
      ],
      providers: [PasswordService],
    })
      .overrideProvider(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterEach(async () => {
    const entities = dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tableNames.length > 0) {
      await dataSource.query(
        `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
      );
    }
    await app.close();
  });

  it('/users (DELETE) - should delete user account with correct password', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
    };

    await request(app.getHttpServer())
      .post('/register')
      .send(userData)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(userData)
      .expect(200);
    const user = await dataSource
      .getRepository('user')
      .findOneBy({ username: 'testuser' });
    expect(user).toBeDefined();

    const response = await request(app.getHttpServer())
      .delete('/users')
      .set('Cookie', `${loginResponse.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        userId: user?.userId,
        password: userData.password,
      });

    expect(response.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toBe('Account successfully deleted');

    // Verify user is gone
    const deletedUser = await dataSource
      .getRepository('user')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      .findOneBy({ userId: user?.userId });
    expect(deletedUser).toBeNull();
  });

  it('/users (DELETE) - should reject deletion with incorrect password', async () => {
    const userData = {
      username: 'wrongpassuser',
      password: 'password123',
    };

    await request(app.getHttpServer())
      .post('/register')
      .send(userData)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(userData)
      .expect(200);

    const user = await dataSource
      .getRepository('user')
      .findOneBy({ username: 'wrongpassuser' });
    expect(user).toBeDefined();

    const response = await request(app.getHttpServer())
      .delete('/users')
      .set('Cookie', `${loginResponse.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        userId: user?.userId,
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toBe('Invalid password');
  });
});
