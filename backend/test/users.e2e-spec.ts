import { Test, TestingModule } from '@nestjs/testing';
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
import { UserEntity } from '../src/user/user.entity';
import { registerAndLogin } from './utils/helper';

@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('UsersController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  beforeAll(async () => {
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
    passwordService = moduleFixture.get(PasswordService);
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
  });
  afterAll(async () => {
    await app.close();
  });
  it('/users (DELETE) - should delete user account with correct password', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
    };
    const agent = await registerAndLogin(
      app,
      userData.username,
      userData.password,
    );
    const response = await agent.delete('/users').send({
      password: userData.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toBe('Account deleted successfully');

    // Verify user is gone
    const deletedUser = await dataSource
      .getRepository(UserEntity)
      .findOneBy({ username: userData.username });
    expect(deletedUser).toBeNull();
  });

  it('/users (DELETE) - should reject deletion with incorrect password', async () => {
    const userData = {
      username: 'wrongpassuser',
      password: 'password123',
    };

    const agent = await registerAndLogin(
      app,
      userData.username,
      userData.password,
    );

    const response = await agent.delete('/users').send({
      password: 'wrongpassword',
    });

    expect(response.status).toBe(401);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toBe('Invalid password');
  });
  it('/users (PATCH) - should update password with correct password', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
    };

    const agent = await registerAndLogin(
      app,
      userData.username,
      userData.password,
    );

    const response = await agent.patch('/users').send({
      password: userData.password,
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });

    expect(response.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toBe('Password updated successfully');
    const user = await dataSource
      .getRepository('user')
      .findOneBy({ username: 'testuser' });
    expect(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await passwordService.verifyPassword('newpassword123', user.password),
    ).toBe(true);
  });
  it('/users (PATCH) - should not update password with incorrect password', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
    };

    const agent = await registerAndLogin(
      app,
      userData.username,
      userData.password,
    );

    const response = await agent.patch('/users').send({
      password: 'wrongpassword1',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(response.status).toBe(401);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toBe('Invalid password');
  });
  it('/users (PATCH) - should not update password with incorrect password', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
    };

    const agent = await registerAndLogin(
      app,
      userData.username,
      userData.password,
    );

    const response = await agent.patch('/users').send({
      password: userData.password,
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword12',
    });
    expect(response.status).toBe(401);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toBe('New passwords do not match');
  });
});
