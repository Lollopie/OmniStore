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
  it('should not let admins promote users to owner', async () => {
    await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('owner1', 'owner'))
      .then((b) => b.withUser('admin1', 'admin'))
      .then((b) => b.withUser('member1', 'member'));
    const agent = await login(app, 'admin1', 'password1');
    const response = await agent
      .patch('/organizations/users')
      .send({ username: 'member1', role: 'owner' })
      .expect(403);
    expect(response.body.message).toBe(
      'You do not have permission to manage users with this role',
    );
  });
  it('should not let the last owner demote themselves', async () => {
    await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('owner1', 'owner'))
      .then((b) => b.withUser('admin1', 'admin'));
    const agent = await login(app, 'owner1', 'password1');
    const response = await agent
      .patch('/organizations/users')
      .send({ username: 'owner1', role: 'admin' })
      .expect(400);
    expect(response.body.message).toBe(
      'An organization must have at least one owner',
    );
  });
  it('should remove a member and invalidate their session', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('owner1', 'owner'))
      .then((b) => b.withUser('member1', 'member'));
    const memberId = scenarioBuilder['users']['member1'].userId;
    const memberAgent = await login(app, 'member1', 'password1');
    await memberAgent.get('/organizations/subscription').expect(200);

    const ownerAgent = await login(app, 'owner1', 'password1');
    await ownerAgent.delete(`/organizations/users/${memberId}`).expect(200);

    const [{ count }]: { count: string }[] = await dataSource.query(
      `SELECT count(*) FROM "user" WHERE user_id = $1`,
      [memberId],
    );
    expect(count).toBe('0');
    const response = await memberAgent
      .get('/organizations/subscription')
      .expect(401);
    expect(response.body.message).toBe('Invalid token');
  });
  it('should not let admins remove owners', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('owner1', 'owner'))
      .then((b) => b.withUser('admin1', 'admin'));
    const agent = await login(app, 'admin1', 'password1');
    await agent
      .delete(
        `/organizations/users/${scenarioBuilder['users']['owner1'].userId}`,
      )
      .expect(403);
    const users = await agent.get('/organizations/users').expect(200);
    expect(users.body.total).toBe(2);
  });
  it('should not remove users of other organizations', async () => {
    const otherOrg = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org2')
      .then((b) => b.withUser('other1', 'member'));
    await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('owner1', 'owner'));
    const agent = await login(app, 'owner1', 'password1');
    const response = await agent
      .delete(`/organizations/users/${otherOrg['users']['other1'].userId}`)
      .expect(404);
    expect(response.body.message).toBe('User not found in organization');
  });
  it('should let an owner leave if another owner remains', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('owner1', 'owner'))
      .then((b) => b.withUser('owner2', 'owner'));
    const agent = await login(app, 'owner1', 'password1');
    const response = await agent
      .delete(
        `/organizations/users/${scenarioBuilder['users']['owner1'].userId}`,
      )
      .expect(200);
    expect(response.headers['set-cookie'][0]).toMatch(/^token=;/);
  });
  describe('settings', () => {
    const countRows = async (table: string, orgId: string) => {
      const [{ count }]: { count: string }[] = await dataSource.query(
        `SELECT count(*) FROM "${table}" WHERE org_id = $1`,
        [orgId],
      );
      return Number(count);
    };
    const seedOrgWithData = () =>
      ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse 1'))
        .then((b) => b.withInventory('Warehouse 1', 'Item', 5))
        .then((b) => b.withUser('owner1', 'owner', ['Warehouse 1'], ['admin']))
        .then((b) => b.withUser('admin1', 'admin'))
        .then((b) => b.withUser('member1', 'member'));
    it('should return the current organization to members', async () => {
      await seedOrgWithData();
      const agent = await login(app, 'member1', 'password1');
      const response = await agent.get('/organizations/me').expect(200);
      expect(response.body).toEqual({
        orgId: expect.any(String),
        name: 'Org1',
        createdAt: expect.any(String),
        subscription: 'starter',
      });
    });
    it('should let admins rename the organization', async () => {
      await seedOrgWithData();
      const agent = await login(app, 'admin1', 'password1');
      const response = await agent
        .patch('/organizations')
        .send({ name: 'Renamed Org' })
        .expect(200);
      expect(response.body.name).toBe('Renamed Org');
      const me = await agent.get('/organizations/me').expect(200);
      expect(me.body.name).toBe('Renamed Org');
    });
    it('should not let members rename the organization', async () => {
      await seedOrgWithData();
      const agent = await login(app, 'member1', 'password1');
      await agent
        .patch('/organizations')
        .send({ name: 'Renamed Org' })
        .expect(403);
      const me = await agent.get('/organizations/me').expect(200);
      expect(me.body.name).toBe('Org1');
    });
    it('should reject invalid organization names', async () => {
      await seedOrgWithData();
      const agent = await login(app, 'owner1', 'password1');
      const response = await agent
        .patch('/organizations')
        .send({ name: 'x'.repeat(65) })
        .expect(400);
      expect(response.body.message).toContain(
        'Organization name is too long (maximum 64 characters)',
      );
    });
    it('should not let admins delete the organization', async () => {
      const scenarioBuilder = await seedOrgWithData();
      const agent = await login(app, 'admin1', 'password1');
      await agent
        .delete('/organizations')
        .send({ confirmName: 'Org1' })
        .expect(403);
      expect(
        await countRows('organization', scenarioBuilder['org'].orgId),
      ).toBe(1);
    });
    it('should require the organization name to delete it', async () => {
      const scenarioBuilder = await seedOrgWithData();
      const agent = await login(app, 'owner1', 'password1');
      const response = await agent
        .delete('/organizations')
        .send({ confirmName: 'Wrong' })
        .expect(400);
      expect(response.body.message).toBe('Organization name does not match');
      expect(
        await countRows('organization', scenarioBuilder['org'].orgId),
      ).toBe(1);
    });
    it('should delete the organization with all its data and members', async () => {
      const scenarioBuilder = await seedOrgWithData();
      const orgId = scenarioBuilder['org'].orgId;
      const otherOrg = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org2')
        .then((b) => b.withWarehouse('Other Warehouse'))
        .then((b) => b.withUser('other1', 'owner'));
      const ownerAgent = await login(app, 'owner1', 'password1');
      await ownerAgent
        .post('/organizations/invites')
        .send({ email: 'new@example.org', role: 'member' })
        .expect(201);
      const memberAgent = await login(app, 'member1', 'password1');

      const response = await ownerAgent
        .delete('/organizations')
        .send({ confirmName: 'Org1' })
        .expect(200);
      expect(response.body.message).toBe('Organization deleted.');
      expect(response.headers['set-cookie'][0]).toMatch(/^token=;/);

      expect(await countRows('organization', orgId)).toBe(0);
      expect(await countRows('warehouse', orgId)).toBe(0);
      expect(await countRows('invite', orgId)).toBe(0);
      const [{ users }]: { users: string }[] = await dataSource.query(
        `SELECT count(*) AS users FROM "user" WHERE username IN ('owner1', 'admin1', 'member1')`,
      );
      expect(users).toBe('0');
      const [{ items }]: { items: string }[] = await dataSource.query(
        `SELECT count(*) AS items FROM inventory`,
      );
      expect(items).toBe('0');
      await memberAgent.get('/organizations/subscription').expect(401);

      const otherOrgId = otherOrg['org'].orgId;
      expect(await countRows('organization', otherOrgId)).toBe(1);
      expect(await countRows('warehouse', otherOrgId)).toBe(1);
      await login(app, 'other1', 'password1');
    });
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
