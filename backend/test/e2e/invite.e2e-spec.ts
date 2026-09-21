import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { JwtModule } from '@nestjs/jwt';
import appConfig from '../../src/config/app.config';
import emailConfig from '../../src/config/email.config';
import { ScenarioBuilder } from './utils/scenarioBuilder';
import { DataSource } from 'typeorm';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
import { getLatestEmailFor, login } from './utils/helper';
import fetch from 'nodemailer/lib/fetch';
import request from 'supertest';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('Invite (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [appConfig, authConfig, dbConfig, emailConfig],
        }),
        AppModule,
        JwtModule.registerAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwtSecret'),
            signOptions: {
              expiresIn: configService.get<number>('auth.jwtExpiresIn'),
            },
          }),
        }),
      ],
      providers: [],
    })
      .overrideProvider(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();
    dataSource = await SeedingDataSource.initialize();
  });
  it('should be able to send invite', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    await agent
      .post('/warehouses/invites')
      .send({ email: 'user2@example.org', role: 'admin' })
      .expect(201);
    const response = await getLatestEmailFor('user2@example.org');
    expect(response['HTML']).toBeDefined();
  });
  it('should be able to accept invite', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    await agent
      .post('/warehouses/invites')
      .send({ email: 'user2@example.org', role: 'admin' })
      .expect(201);
    const response = await getLatestEmailFor('user2@example.org');
    const verificationToken: string = response['HTML']
      .split('token=')[1]
      .split('"')[0];
    const registerResponse = await request(app.getHttpServer())
      .post('/invites/accept?token=' + verificationToken)
      .send({
        username: 'user2',
        password: 'password1',
      });
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body['message']).toBe(
      'Invite accepted successfully',
    );
    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'user2', password: 'password1' });
    expect(loginResponse.status).toBe(200);
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
    await dataSource.destroy();
    await app.close();
  });
});
