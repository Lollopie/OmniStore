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
import { login } from './utils/helper';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('Organization (e2e)', () => {
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
  it('should be able to get org users', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined))
      .then((b) => b.withUser('user2', 'admin', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');

    const response = await agent.get('/organizations/users').expect(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.total).toEqual(2);
    expect(response.body.data[0].username).toEqual('user1');
    expect(response.body.data[1].username).toEqual('user2');
  });
  it('should be able to filter org users', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined))
      .then((b) => b.withUser('user2', 'admin', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');

    const response = await agent
      .get('/organizations/users?search=2')
      .expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.total).toEqual(1);
    expect(response.body.data[0].username).toEqual('user2');
  });
  it('should be able to update org user roles', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined))
      .then((b) => b.withUser('user2', 'admin', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');

    const response = await agent
      .patch('/organizations/users')
      .send({
        username: 'user2',
        role: 'owner',
      })
      .expect(200);
    expect(response.body['userId']).toBe(
      scenarioBuilder['users']['user2'].userId,
    );
    expect(response.body['orgId']).toBe(scenarioBuilder['org'].orgId);
    expect(response.body['role']).toBe('owner');
    const getResponse = await agent.get('/organizations/users').expect(200);
    expect(getResponse.body.data).toHaveLength(2);
    expect(getResponse.body.total).toEqual(2);
    expect(getResponse.body.data[1].role).toEqual('owner');
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
