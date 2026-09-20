import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { UserEntity } from '../../src/user/user.entity';
import { login } from './utils/helper';
import { AuthService } from '../../src/auth/auth.service';
import { MailService } from '../../src/mail/mail.service';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
import { ScenarioBuilder } from './utils/scenarioBuilder';

@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('UsersController (e2e)', () => {
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
    app.use(cookieParser());
    await app.init();
    dataSource = await SeedingDataSource.initialize();
    authService = moduleFixture.get(AuthService);
  });
  it('/users (DELETE) - should delete user account with correct password', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const response = await agent.delete('/users').send({
      password: 'password1',
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Account deleted successfully');

    // Verify user is gone
    const deletedUser = await dataSource
      .getRepository(UserEntity)
      .findOneBy({ username: user.username });
    expect(deletedUser).toBeNull();
  });

  it('/users (PATCH) - should update password with correct password', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');

    const response = await agent.patch('/users').send({
      password: 'password1',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password updated successfully');
    const newUser = await dataSource
      .getRepository(UserEntity)
      .findOneBy({ username: 'user1' });
    expect(
      await authService.verifyPassword('newpassword123', newUser.password),
    ).toBe(true);
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
    await dataSource.destroy();
    await app.close();
  });
});
