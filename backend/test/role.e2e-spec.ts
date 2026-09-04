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
import { inviteAndAccept, registerAndLogin } from './utils/helper';
import { CookieAccessInfo } from 'cookiejar';
import { MailService } from '../src/mail/mail.service';
import { Cookie } from '../src/user/user.decorator';
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
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });
  it('RoleGuard no warehouse', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'username',
      'password1',
    );
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
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'username',
      'password1',
    );
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
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'username',
      'password1',
      'testOrg',
      true,
    );
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
      mockMailService,
      'test@example.org',
      'username',
      'password1',
      'testOrg',
      true,
    );
    const secondAgent = await inviteAndAccept(
      app,
      mockMailService,
      firstAgent,
      'test2@example.org',
      'admin',
    );
    await firstAgent
      .post('/warehouses')
      .send({ warehouseName: 'Warehouse 2' })
      .expect(201);
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
    const newToken: Cookie = {
      userId: secondToken.userId,
      username: secondToken.username,
      activeWarehouseId: token.activeWarehouseId,
      activeRole: 'admin',
      orgId: secondToken.orgId,
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
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'username',
      'password1',
      'testOrg',
      true,
    );
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
