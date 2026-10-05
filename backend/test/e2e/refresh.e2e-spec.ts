import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { JwtModule, JwtService } from '@nestjs/jwt';
import appConfig from '../../src/config/app.config';
import emailConfig from '../../src/config/email.config';
import { ScenarioBuilder } from './utils/scenarioBuilder';
import { DataSource } from 'typeorm';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
import { Cookie } from '../../src/user/user.decorator';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

type Session = { token?: string; refreshToken?: string };

/** Reads the session cookies a response set, keeping the old ones it didn't touch. */
function sessionFrom(response: request.Response, previous: Session = {}) {
  const setCookies = ([] as string[]).concat(
    response.headers['set-cookie'] ?? [],
  );
  const read = (name: string) =>
    setCookies
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.split(';')[0]
      .slice(name.length + 1);
  return {
    token: read('token') ?? previous.token,
    refreshToken: read('refresh_token') ?? previous.refreshToken,
  };
}

function cookieHeader(session: Session) {
  return [
    session.token ? `token=${session.token}` : null,
    session.refreshToken ? `refresh_token=${session.refreshToken}` : null,
  ]
    .filter(Boolean)
    .join('; ');
}

describe('Session refresh (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
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
    jwtService = moduleFixture.get(JwtService);
    dataSource = await SeedingDataSource.initialize();
  });

  const server = () => app.getHttpServer();
  async function loginAs(username: string): Promise<Session> {
    const response = await request(server())
      .post('/login')
      .send({ username, password: 'password1' })
      .expect(200);
    return sessionFrom(response);
  }
  const refresh = (session: Session) =>
    request(server())
      .post('/auth/refresh')
      .set('Cookie', cookieHeader(session));
  const status = (session: Session) =>
    request(server()).get('/auth/status').set('Cookie', cookieHeader(session));
  async function seedUsers() {
    return await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('owner1', 'owner', ['Warehouse 1'], ['admin']))
      .then((b) => b.withUser('member1', 'member'));
  }

  it('should set a refresh token cookie on login', async () => {
    await seedUsers();
    const session = await loginAs('owner1');
    expect(session.token).toBeDefined();
    expect(session.refreshToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should rotate the refresh token and issue a new access token', async () => {
    await seedUsers();
    const session = await loginAs('owner1');
    const response = await refresh(session).expect(200);
    const renewed = sessionFrom(response);
    expect(renewed.refreshToken).toMatch(/^[0-9a-f]{64}$/);
    expect(renewed.refreshToken).not.toBe(session.refreshToken);
    expect(renewed.token).toBeDefined();
    await status({ token: renewed.token }).expect(200);
  });

  it('should restore a session from the refresh token alone', async () => {
    await seedUsers();
    const session = await loginAs('member1');
    const response = await refresh({
      refreshToken: session.refreshToken,
    }).expect(200);
    expect((await status(sessionFrom(response))).status).toBe(200);
  });

  it('should keep the active warehouse while the user still belongs to it', async () => {
    await seedUsers();
    const session = await loginAs('owner1');
    const before = jwtService.decode<Cookie>(session.token!);
    const response = await refresh(session).expect(200);
    const after = jwtService.decode<Cookie>(sessionFrom(response).token!);
    expect(after.activeWarehouseId).toBe(before.activeWarehouseId);
    expect(after.activeWarehouseId).not.toBe('');
    expect(after.activeRole).toBe('admin');
  });

  it('should reject unknown refresh tokens and clear the cookies', async () => {
    const response = await refresh({ refreshToken: 'f'.repeat(64) }).expect(
      401,
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^token=;/),
        expect.stringMatching(/^refresh_token=;/),
      ]),
    );
  });

  it('should allow tabs to refresh with the same token at the same time', async () => {
    await seedUsers();
    const session = await loginAs('owner1');
    expect((await refresh(session)).status).toBe(200);
    expect((await refresh(session)).status).toBe(200);
  });

  it('should end every session when a rotated refresh token is reused', async () => {
    await seedUsers();
    const session = await loginAs('owner1');
    const renewed = sessionFrom(await refresh(session).expect(200), session);
    // Past the grace period for tabs refreshing at the same time
    await dataSource.query(
      `UPDATE refresh_tokens SET rotated_at = now() - interval '1 minute' WHERE rotated_at IS NOT NULL`,
    );

    expect((await refresh(session)).status).toBe(401);
    expect((await refresh(renewed)).status).toBe(401);
    expect((await status({ token: renewed.token })).status).toBe(401);
  });

  it('should not refresh the session of a removed member', async () => {
    const scenario = await seedUsers();
    const memberSession = await loginAs('member1');
    const ownerSession = await loginAs('owner1');
    await request(server())
      .delete(`/organizations/users/${scenario['users']['member1'].userId}`)
      .set('Cookie', cookieHeader(ownerSession))
      .expect(200);

    expect((await status(memberSession)).status).toBe(401);
    expect((await refresh(memberSession)).status).toBe(401);
  });

  it('should invalidate the refresh token on logout', async () => {
    await seedUsers();
    const session = await loginAs('owner1');
    const response = await request(server())
      .post('/logout')
      .set('Cookie', cookieHeader(session))
      .expect(200);
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^refresh_token=;/)]),
    );
    await refresh(session).expect(401);
  });

  it('should keep other devices signed in on logout', async () => {
    await seedUsers();
    const laptop = await loginAs('owner1');
    const phone = await loginAs('owner1');
    await request(server())
      .post('/logout')
      .set('Cookie', cookieHeader(laptop))
      .expect(200);
    expect((await refresh(phone)).status).toBe(200);
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
