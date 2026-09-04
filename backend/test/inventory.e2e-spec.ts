import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import cookieParser from 'cookie-parser';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { registerAndLogin } from './utils/helper';
import { CookieAccessInfo } from 'cookiejar';
import { MailService } from '../src/mail/mail.service';

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
              expiresIn: configService.get<number>('auth.jwtExpiresIn'),
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

  it('/inventory unauthorized (GET)', () => {
    return request(app.getHttpServer()).get('/inventory').expect(401);
  });

  it('/inventory without warehouse (GET)', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
    );
    await agent.get('/inventory').expect(400);
  });

  it('should create and read inventory for the authenticated user only', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');

    const listResponse = await agent.get('/inventory').expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0][0].itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(listResponse.body[0][0].amount)).toBe('5');
  });

  it('should enforce RLS isolation between two orgs', async () => {
    const aliceAgent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.rls',
      'Password123',
      'testOrg',
      true,
    );
    const bobAgent = await registerAndLogin(
      app,
      mockMailService,
      'test2@example.org',
      'bob.inventory.rls',
      'Password123',
      'testOrg2',
      true,
    );
    await aliceAgent
      .post('/inventory')
      .send({ itemName: 'Alice item', amount: '1' })
      .expect(201);

    await bobAgent
      .post('/inventory')
      .send({ itemName: 'Bob item', amount: '2' })
      .expect(201);

    const aliceList = await aliceAgent.get('/inventory').expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(aliceList.body[0]).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(aliceList.body[1]).toBe(1);

    const bobList = await bobAgent.get('/inventory').expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(bobList.body[0]).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(bobList.body[1]).toBe(1);
  });
  it('should enforce RLS isolation between two warehouses', async () => {
    const aliceAgent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.rls',
      'Password123',
      'testOrg',
      true,
    );

    await aliceAgent
      .post('/inventory')
      .send({ itemName: 'Alice item', amount: '1' })
      .expect(201);
    await aliceAgent
      .post('/warehouses')
      .send({ warehouseName: 'Warehouse 2' })
      .expect(201);
    await aliceAgent
      .post('/inventory')
      .send({ itemName: 'Bob item', amount: '2' })
      .expect(201);
    const bobList = await aliceAgent.get('/inventory').expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(bobList.body[0]).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(bobList.body[1]).toBe(1);
  });
  it('should only return 10 items', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 15;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await agent.get('/inventory').expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
  });
  it('default sort by new', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await agent.get('/inventory').expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(
        (numberOfItems - i - 1).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by old', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await agent.get('/inventory?sort=old').expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by itemName asc', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await agent
      .get('/inventory?sort=itemName asc')
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by itemName desc', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await agent
      .get('/inventory?sort=itemName desc')
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(
        (numberOfItems - i - 1).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by amount asc', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: i.toString() })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe(i.toString());
    }
    const listResponse = await agent
      .get('/inventory?sort=amount asc')
      .expect(200);
    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe(i.toString());
    }
  });
  it('sort by amount desc', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: i.toString() })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe(i.toString());
    }
    const listResponse = await agent
      .get('/inventory?sort=amount desc')
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(
        (numberOfItems - i - 1).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe(
        (numberOfItems - i - 1).toString(),
      );
    }
  });
  it('sort by amount asc tiebreaker', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');

      const createResponse2 = await agent
        .post('/inventory')
        .send({ itemName: (numberOfItems + i).toString(), amount: '2' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse2.body.itemName).toBe(
        (numberOfItems + i).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse2.body.amount)).toBe('2');
    }
    const listResponse = await agent
      .get('/inventory?sort=amount asc')
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by amount desc tiebreaker', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');

      const createResponse2 = await agent
        .post('/inventory')
        .send({ itemName: (numberOfItems + i).toString(), amount: '2' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse2.body.itemName).toBe(
        (numberOfItems + i).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse2.body.amount)).toBe('2');
    }
    const listResponse = await agent
      .get('/inventory?sort=amount desc')
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].itemName).toBe(
        (i + numberOfItems).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('2');
    }
  });
  it('pagination', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const numberOfItems = 100;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await agent
        .post('/inventory')
        .send({ itemName: i.toString(), amount: '1' })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.itemName).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    for (let i = 0; i < Math.ceil(numberOfItems / 10); i++) {
      const listResponse = await agent
        .get('/inventory?page=' + (i + 1))
        .expect(200);
      expect(listResponse.body).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0]).toHaveLength(10);
      for (let j = 0; j < 10; j++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(listResponse.body[0][j].itemName).toBe(
          (numberOfItems - (i * 10 + j + 1)).toString(),
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(String(listResponse.body[0][j].amount)).toBe('1');
      }
    }
  });
  it('edit item', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemId).toBeDefined();

    const listResponse = await agent
      .patch('/inventory')
      .send({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        itemId: createResponse.body.itemId,
        itemName: 'Apples',
        amount: '5',
      })
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body['amount']).toBe(5);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body['itemName']).toBe('Apples');
  });
  it('edit no itemId', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemId).toBeDefined();

    await agent
      .patch('/inventory')
      .send({
        itemName: 'Apples',
        amount: '5',
      })
      .expect(400);
  });
  it('edit wrong itemId', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemId).toBeDefined();

    await agent
      .patch('/inventory')
      .send({
        itemId: '019fa8c5-9e10-7dca-bc57-02af04a588f8',
        itemName: 'Apples',
        amount: '5',
      })
      .expect(404);
  });
  it('delete item', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemId).toBeDefined();

    const listResponse = await agent
      .delete('/inventory')
      .send({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        itemId: createResponse.body.itemId,
        itemName: 'Apples',
        amount: '5',
      })
      .expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body['message']).toBe('Item has been deleted.');
  });
  it('delete no itemId', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemId).toBeDefined();

    await agent
      .delete('/inventory')
      .send({
        itemName: 'Apples',
        amount: '5',
      })
      .expect(400);
  });
  it('delete wrong itemId', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    const createResponse = await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemName).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.itemId).toBeDefined();

    await agent
      .delete('/inventory')
      .send({
        itemId: '019fa8c5-9e10-7dca-bc57-02af04a588f8',
        itemName: 'Apples',
        amount: '5',
      })
      .expect(404);
  });
  it('search', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
      'testOrg',
      true,
    );
    await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);
    await agent
      .post('/inventory')
      .send({ itemName: 'Cookies', amount: '5' })
      .expect(201);
    const searchResponse = await agent.get('/inventory?search=Coo').expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(searchResponse.body[1]).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(searchResponse.body[0][0].itemName).toBe('Cookies');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(searchResponse.body[0][0].amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(searchResponse.body[0][0].itemId).toBeDefined();
  });
  it('non existent warehouseId', async () => {
    const agent = await registerAndLogin(
      app,
      mockMailService,
      'test@example.org',
      'alice.inventory.test',
      'Password123',
    );
    const aliceToken = agent.jar.getCookie(
      'token',
      new CookieAccessInfo('127.0.0.1', '/', false, false),
    );
    const assignedToken: {
      userId: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = jwtService.decode(aliceToken.value);
    aliceToken.value = jwtService.sign({
      userId: assignedToken.userId,
      username: assignedToken.username,
      activeWarehouseId: '019fa8c5-6daa-73cb-bcdd-c6d56fb5ae05',
      activeRole: assignedToken.activeRole,
    });
    await agent
      .post('/inventory')
      .send({ itemName: 'Apples', amount: '5' })
      .expect(400);
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
