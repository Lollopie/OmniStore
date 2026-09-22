import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { login } from './utils/helper';
import { CookieAccessInfo } from 'cookiejar';
import { Cookie } from '../../src/user/user.decorator';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
import { ScenarioBuilder } from './utils/scenarioBuilder';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('RoleGuard (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
        JwtModule.registerAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwtSecret'),
            signOptions: {
              expiresIn: 1,
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
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });
  it('RoleGuard no warehouse', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const roleGuardResponse = await agent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(400);
    expect(roleGuardResponse.body.message).toBe('No active Warehouse found');
  });
  it('RoleGuard non-existent warehouse', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const cookie = agent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const token: Cookie = jwtService.decode(cookie.value);
    delete token.exp;
    const newToken: Cookie = {
      ...token,
      activeWarehouseId: '019fa8c5-6daa-73cb-bcdd-c6d56fb5ae05',
    };
    cookie.value = jwtService.sign(newToken);
    const roleGuardResponse = await agent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(400);
    expect(roleGuardResponse.body.message).toBe('Active Warehouse not found');
  });
  it('RoleGuard with permission', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const response = await agent.post('/inventory').send({
      itemName: 'Apple',
      amount: '1',
    });
    expect(response.status).toBe(201);
  });
  it('RoleGuard without role in warehouse', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']))
      .then((b) => b.withUser('user2', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const userTwo = scenarioBuilder['users']['user2'];
    const firstAgent = await login(app, user.username, 'password1');
    const secondAgent = await login(app, userTwo.username, 'password1');
    const cookie = firstAgent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const secondCookie = secondAgent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const token: Cookie = jwtService.decode(cookie.value);
    const secondToken: Cookie = jwtService.decode(secondCookie.value);
    delete token.exp;
    const newToken: Cookie = {
      ...token,
      userId: secondToken.userId,
      username: secondToken.username,
    };
    cookie.value = jwtService.sign(newToken);
    secondAgent.jar.setCookie(cookie);
    const roleGuardResponse = await secondAgent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(403);
    expect(roleGuardResponse.body.message).toBe(
      'You do not have access to the active warehouse',
    );
  });
  it('RoleGuard without permission', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['staff']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const roleGuardResponse = await agent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(403);
    expect(roleGuardResponse.body.message).toBe(
      'You do not have the required role to access this resource',
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
  });
  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });
});
