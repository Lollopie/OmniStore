import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { registerAndLogin } from './utils/helper';
import { CookieAccessInfo } from 'cookiejar';
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
    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });
  it('RoleGuard no warehouse', async () => {
    const agent = await registerAndLogin(app, 'username', 'password1');
    const roleGuardResponse = await agent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(400);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(roleGuardResponse.body.message).toBe('No active Warehouse found');
  });
  it('RoleGuard non-existent warehouse', async () => {
    const agent = await registerAndLogin(app, 'username', 'password1');
    const cookie = agent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const token: {
      userId: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = jwtService.decode(cookie.value);
    const newToken: {
      userId: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = {
      userId: token.userId,
      username: token.username,
      activeWarehouseId: '019fa8c5-6daa-73cb-bcdd-c6d56fb5ae05',
      activeRole: 'admin',
    };
    cookie.value = jwtService.sign(newToken);
    const roleGuardResponse = await agent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(400);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(roleGuardResponse.body.message).toBe('Active Warehouse not found');
  });
  it('RoleGuard with permission', async () => {
    const agent = await registerAndLogin(app, 'username', 'password1', true);
    await agent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(201);
  });
  it('RoleGuard without role in warehouse', async () => {
    const firstAgent = await registerAndLogin(
      app,
      'username',
      'password1',
      true,
    );
    const secondAgent = await registerAndLogin(
      app,
      'username2',
      'password1',
      false,
    );
    const cookie = firstAgent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const secondCookie = secondAgent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const token: {
      userId: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = jwtService.decode(cookie.value);
    const secondToken: {
      userId: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = jwtService.decode(secondCookie.value);
    const newToken: {
      userId: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = {
      userId: secondToken.userId,
      username: secondToken.username,
      activeWarehouseId: token.activeWarehouseId,
      activeRole: 'admin',
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(roleGuardResponse.body.message).toBe(
      'You do not have access to the active warehouse',
    );
  });
  it('RoleGuard without permission', async () => {
    const agent = await registerAndLogin(app, 'username', 'password1', true);
    await agent
      .patch('/warehouses/users')
      .send({
        username: 'username',
        role: 'staff',
      })
      .expect(200);
    const roleGuardResponse = await agent
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .expect(403);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
