import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { login } from './utils/helper';
import { MailService } from '../../src/mail/mail.service';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
import { ScenarioBuilder } from './utils/scenarioBuilder';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('WarehouseController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
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
  });
  it('Warehouse Create', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const warehouseResponse = await agent
      .post('/warehouses')
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    expect(warehouseResponse.body).toEqual({
      name: 'Warehouse 1',
      warehouseId: expect.any(String),
      role: 'admin',
    });
    expect(warehouseResponse.headers['set-cookie'][0]).toMatch(
      /token=.+; Max-Age=3600; Path=\/; Expires=.+; HttpOnly; SameSite=(?:Lax|None)/,
    );
  });
  it('Warehouse Select', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const warehouseResponse = await agent
      .post('/warehouses')
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const selectResponse = await agent
      .post('/warehouses/select')
      .send({
        warehouseId: warehouseResponse.body.warehouseId,
      })
      .expect(201);
    expect(selectResponse.body).toEqual({
      activeRole: 'admin',
    });
    expect(selectResponse.headers['set-cookie'][0]).toMatch(
      /token=.+; Path=\/; Expires=.+; HttpOnly; SameSite=(?:Lax|None)/,
    );
  });
  it('Warehouse getUsers', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const getUsersResponse = await agent.get('/warehouses/users').expect(200);
    expect(getUsersResponse.body['total']).toEqual(1);
    expect(getUsersResponse.body['data']).toEqual([
      {
        userId: expect.any(String),
        username: 'user1',
        role: 'admin',
      },
    ]);
  });
  it('Warehouse patchUsers', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const patchUserResponse = await agent
      .patch('/warehouses/users')
      .send({
        username: 'user1',
        role: 'staff',
      })
      .expect(200);
    expect(patchUserResponse.body).toEqual({
      userId: expect.any(String),
      warehouseId: expect.any(String),
      role: 'staff',
    });
  });
  it('Warehouse patch non-existent user', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const patchUserResponse = await agent
      .patch('/warehouses/users')
      .send({
        username: 'username2',
        role: 'staff',
      })
      .expect(404);
    expect(patchUserResponse.body.message).toEqual('User not found');
  });
  it('Warehouse patch user not in warehouse', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']))
      .then((b) => b.withUser('user2', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const postUsersResponse = await agent
      .patch('/warehouses/users')
      .send({
        username: 'user2',
        role: 'admin',
      })
      .expect(404);
    expect(postUsersResponse.body.message).toEqual(
      'User is not assigned to this warehouse',
    );
  });
  it('Warehouse getUsers search', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']))
      .then((b) => b.withUser('user2', 'owner', ['Warehouse 1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const getUsersResponse = await agent
      .get('/warehouses/users?search=2')
      .expect(200);
    expect(getUsersResponse.body['total']).toEqual(1);
    expect(getUsersResponse.body['data']).toEqual([
      {
        userId: expect.any(String),
        username: 'user2',
        role: 'admin',
      },
    ]);
  });
  it('should be able to add an org user to a warehouse', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse 1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse 1'], ['admin']))
      .then((b) => b.withUser('user2', 'owner', undefined, undefined));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const postUsersResponse = await agent
      .post('/warehouses/users')
      .send({
        username: 'user2',
        role: 'admin',
      })
      .expect(201);
    expect(postUsersResponse.body).toEqual({
      userId: expect.any(String),
      warehouseId: expect.any(String),
      role: 'admin',
    });
    const getUsersResponse = await agent
      .get('/warehouses/users?search=2')
      .expect(200);
    expect(getUsersResponse.body['total']).toEqual(1);
    expect(getUsersResponse.body['data']).toEqual([
      {
        userId: expect.any(String),
        username: 'user2',
        role: 'admin',
      },
    ]);
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
