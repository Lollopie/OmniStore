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
import request from 'supertest';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('Organization invites (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  const getInviteToken = async (email: string): Promise<string> => {
    const response = await getLatestEmailFor(email);
    return response['HTML'].split('token=')[1].split('"')[0];
  };
  const acceptInvite = (token: string, username: string) =>
    request(app.getHttpServer())
      .post('/invites/accept?token=' + token)
      .send({ username, password: 'password1' });
  const withOwnerAndAdmin = () =>
    ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('owner1', 'owner'))
      .then((b) => b.withUser('admin1', 'admin'))
      .then((b) => b.withUser('member1', 'member'));
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
  it('should invite a user to the organization with the given org role', async () => {
    await withOwnerAndAdmin();
    const agent = await login(app, 'owner1', 'password1');
    await agent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'admin' })
      .expect(201);

    const token = await getInviteToken('new@example.org');
    const acceptResponse = await acceptInvite(token, 'newuser');
    expect(acceptResponse.status).toBe(201);
    expect(acceptResponse.body.message).toBe('Invite accepted successfully');

    const [row]: { role: string }[] = await dataSource.query(
      `SELECT uor.role FROM user_org_role uor JOIN "user" u ON u.user_id = uor.user_id WHERE u.username = 'newuser'`,
    );
    expect(row.role).toBe('admin');
    const warehouseRoles: unknown[] = await dataSource.query(
      `SELECT 1 FROM user_warehouse_role uwr JOIN "user" u ON u.user_id = uwr.user_id WHERE u.username = 'newuser'`,
    );
    expect(warehouseRoles).toHaveLength(0);
    await login(app, 'newuser', 'password1');
  });
  it('should not allow admins to invite owners', async () => {
    await withOwnerAndAdmin();
    const agent = await login(app, 'admin1', 'password1');
    const response = await agent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'owner' })
      .expect(403);
    expect(response.body.message).toBe(
      'You do not have permission to invite users with this role',
    );
  });
  it('should not allow members to manage invites', async () => {
    await withOwnerAndAdmin();
    const agent = await login(app, 'member1', 'password1');
    const response = await agent.get('/organizations/invites').expect(403);
    expect(response.body.message).toBe(
      'You do not have the required role to access this resource',
    );
  });
  it('should reject invites for existing users', async () => {
    const scenarioBuilder = await withOwnerAndAdmin();
    const agent = await login(app, 'owner1', 'password1');
    const response = await agent
      .post('/organizations/invites')
      .send({
        email: scenarioBuilder['users']['member1'].email,
        role: 'member',
      })
      .expect(400);
    expect(response.body.message).toBe('User already exists');
  });
  it('should list and revoke pending invites', async () => {
    await withOwnerAndAdmin();
    const agent = await login(app, 'admin1', 'password1');
    await agent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'member' })
      .expect(201);
    const token = await getInviteToken('new@example.org');

    const listResponse = await agent.get('/organizations/invites').expect(200);
    expect(listResponse.body).toEqual([
      {
        inviteId: expect.any(String),
        email: 'new@example.org',
        role: 'member',
        warehouseId: null,
        warehouseName: null,
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ]);

    await agent
      .delete(`/organizations/invites/${listResponse.body[0].inviteId}`)
      .expect(200);
    const afterRevoke = await agent.get('/organizations/invites').expect(200);
    expect(afterRevoke.body).toHaveLength(0);
    expect((await acceptInvite(token, 'newuser')).status).toBe(400);
  });
  it('should replace the previous invite when inviting the same email again', async () => {
    await withOwnerAndAdmin();
    const agent = await login(app, 'owner1', 'password1');
    await agent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'member' })
      .expect(201);
    await agent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'admin' })
      .expect(201);
    const listResponse = await agent.get('/organizations/invites').expect(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].role).toBe('admin');
  });
  it('should resend an invite with a new token', async () => {
    await withOwnerAndAdmin();
    const agent = await login(app, 'owner1', 'password1');
    await agent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'member' })
      .expect(201);
    const oldToken = await getInviteToken('new@example.org');
    const listResponse = await agent.get('/organizations/invites').expect(200);

    await agent
      .post(`/organizations/invites/${listResponse.body[0].inviteId}/resend`)
      .expect(201);
    const newToken = await getInviteToken('new@example.org');
    expect(newToken).not.toBe(oldToken);
    expect((await acceptInvite(oldToken, 'newuser')).status).toBe(400);
    expect((await acceptInvite(newToken, 'newuser')).status).toBe(201);
  });
  it('should not let admins revoke owner invites', async () => {
    await withOwnerAndAdmin();
    const ownerAgent = await login(app, 'owner1', 'password1');
    await ownerAgent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'owner' })
      .expect(201);
    const listResponse = await ownerAgent
      .get('/organizations/invites')
      .expect(200);

    const adminAgent = await login(app, 'admin1', 'password1');
    await adminAgent
      .delete(`/organizations/invites/${listResponse.body[0].inviteId}`)
      .expect(403);
    const afterAttempt = await ownerAgent
      .get('/organizations/invites')
      .expect(200);
    expect(afterAttempt.body).toHaveLength(1);
  });
  it('should not expose invites of other organizations', async () => {
    await withOwnerAndAdmin();
    const agent = await login(app, 'owner1', 'password1');
    await agent
      .post('/organizations/invites')
      .send({ email: 'new@example.org', role: 'member' })
      .expect(201);
    const [{ inviteId }]: { inviteId: string }[] = (
      await agent.get('/organizations/invites').expect(200)
    ).body;

    await ScenarioBuilder.create(dataSource)
      .withOrganization('Org2')
      .then((b) => b.withUser('owner2', 'owner'));
    const otherAgent = await login(app, 'owner2', 'password1');
    const otherList = await otherAgent
      .get('/organizations/invites')
      .expect(200);
    expect(otherList.body).toHaveLength(0);
    await otherAgent.delete(`/organizations/invites/${inviteId}`).expect(404);
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
    await fetch('http://localhost:8025/api/v1/messages', {
      method: 'DELETE',
    });
  });
  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });
});
