import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import cookieParser from 'cookie-parser';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { login } from './utils/helper';
import { CookieAccessInfo } from 'cookiejar';
import { Cookie } from '../../src/user/user.decorator';
import { ScenarioBuilder } from './utils/scenarioBuilder';
import { SeedingDataSource } from '../databaseSeeds/typeorm.config';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('InventoryController (e2e)', () => {
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
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  it('/inventory unauthorized (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/inventory');
    expect(response.status).toBe(401);
  });

  it('/inventory without warehouse (GET)', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withUser('user1', 'owner', undefined, undefined));

    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const response = await agent.get('/inventory');
    expect(response.status).toBe(400);
  });

  it('should create and read inventory for warehouse', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']));

    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    expect(createResponse.body.itemName).toBe('Apples');
    expect(String(createResponse.body.amount)).toBe('5');

    const listResponse = await agent.get('/inventory').expect(200);

    expect(listResponse.body).toHaveLength(2);
    expect(listResponse.body[0]).toHaveLength(1);
    expect(listResponse.body[0][0].itemName).toBe('Apples');
    expect(String(listResponse.body[0][0].amount)).toBe('5');
  });

  it('should enforce RLS isolation between two orgs', async () => {
    const aliceScenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']))
      .then((b) => b.withInventory('Warehouse1', 'Apple', 1));
    const alice = aliceScenarioBuilder['users']['user1'];
    const aliceAgent = await login(app, alice.username, 'password1');

    const bobScenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org2')
      .then((b) => b.withWarehouse('Warehouse2'))
      .then((b) => b.withUser('user2', 'owner', ['Warehouse2'], ['admin']))
      .then((b) => b.withInventory('Warehouse2', 'Banana', 2));
    const bob = bobScenarioBuilder['users']['user2'];
    const bobAgent = await login(app, bob.username, 'password1');

    const aliceList = await aliceAgent.get('/inventory').expect(200);

    expect(aliceList.body[0]).toHaveLength(1);
    expect(aliceList.body[1]).toBe(1);
    expect(aliceList.body[0][0]['itemName']).toBe('Apple');
    expect(aliceList.body[0][0]['amount']).toBe(1);

    const bobList = await bobAgent.get('/inventory').expect(200);

    expect(bobList.body[0]).toHaveLength(1);
    expect(bobList.body[1]).toBe(1);
    expect(bobList.body[0][0]['itemName']).toBe('Banana');
    expect(bobList.body[0][0]['amount']).toBe(2);
  });
  it('should enforce RLS isolation between two warehouses', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withWarehouse('Warehouse2'))
      .then((b) =>
        b.withUser(
          'user1',
          'owner',
          ['Warehouse1', 'Warehouse2'],
          ['admin', 'admin'],
        ),
      )
      .then((b) => b.withInventory('Warehouse1', 'Apple', 1))
      .then((b) => b.withInventory('Warehouse2', 'Banana', 2));

    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');

    const bobList = await agent.get('/inventory').expect(200);

    expect(bobList.body[0]).toHaveLength(1);
    expect(bobList.body[1]).toBe(1);
  });
  it('should allow for item editing', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']))
      .then((b) => b.withInventory('Warehouse1', 'Apple', 1));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const item = scenarioBuilder['inventory']['Apple'];
    const listResponse = await agent
      .patch('/inventory')
      .send({
        itemId: item.itemId,
        itemName: 'Banana',
        amount: '10',
      })
      .expect(200);

    expect(listResponse.body['amount']).toBe(10);
    expect(listResponse.body['itemName']).toBe('Banana');

    const postEditList = await agent.get('/inventory').expect(200);
    expect(postEditList.body[0][0]['itemName']).toBe('Banana');
    expect(postEditList.body[0][0]['amount']).toBe(10);
  });
  it('delete item', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']))
      .then((b) => b.withInventory('Warehouse1', 'Apple', 1));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const item = scenarioBuilder['inventory']['Apple'];

    const listResponse = await agent
      .delete('/inventory')
      .send({
        itemId: item.itemId,
        itemName: 'Apples',
        amount: '5',
      })
      .expect(200);
    expect(listResponse.body['message']).toBe('Item has been deleted.');
    const postDeleteList = await agent.get('/inventory').expect(200);
    expect(postDeleteList.body[0]).toHaveLength(0);
    expect(postDeleteList.body[1]).toBe(0);
  });
  it('search', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']))
      .then((b) => b.withInventory('Warehouse1', 'Apple', 1))
      .then((b) => b.withInventory('Warehouse1', 'Cookies', 5));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');

    const searchResponse = await agent.get('/inventory?search=Coo').expect(200);
    expect(searchResponse.body[1]).toBe(1);
    expect(searchResponse.body[0][0].itemName).toBe('Cookies');
    expect(String(searchResponse.body[0][0].amount)).toBe('5');
    expect(searchResponse.body[0][0].itemId).toBeDefined();
  });
  it('non existent warehouseId', async () => {
    const scenarioBuilder = await ScenarioBuilder.create(dataSource)
      .withOrganization('Org1')
      .then((b) => b.withWarehouse('Warehouse1'))
      .then((b) => b.withUser('user1', 'owner', ['Warehouse1'], ['admin']));
    const user = scenarioBuilder['users']['user1'];
    const agent = await login(app, user.username, 'password1');
    const aliceToken = agent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const assignedToken: Cookie = jwtService.decode(aliceToken.value);
    delete assignedToken.exp;
    aliceToken.value = jwtService.sign({
      ...assignedToken,
      activeWarehouseId: '019fa8c5-6daa-73cb-bcdd-c6d56fb5ae05',
    });
    const response = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' });
    expect(response.status).toBe(400);
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
