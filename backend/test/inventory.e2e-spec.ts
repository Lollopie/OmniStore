import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import cookieParser from 'cookie-parser';
async function registerAndLogin(
  app: NestExpressApplication,
  username: string,
  password: string,
): Promise<string> {
  await request(app.getHttpServer())
    .post('/register')
    .send({ username, password })
    .expect(201);

  const response = await request(app.getHttpServer())
    .post('/login')
    .send({ username, password })
    .expect(200);
  return response.headers['set-cookie'][0].split(';')[0];
}

describe('InventoryController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env`, `.env.${process.env.NODE_ENV || 'test'}`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
      ],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    // await dataSource.query(
    //   `ALTER TABLE "inventory" FORCE ROW LEVEL SECURITY;`,
    // );
    // await dataSource.query(`
    //   DO $$
    //   BEGIN
    //     CREATE ROLE inventory_rls_tester NOLOGIN;
    //   EXCEPTION
    //     WHEN duplicate_object THEN NULL;
    //   END
    //   $$;
    // `);
    // await dataSource.query(
    //   `GRANT USAGE ON SCHEMA public TO inventory_rls_tester;`,
    // );
    // await dataSource.query(
    //   `GRANT SELECT ON TABLE "inventory" TO inventory_rls_tester;`,
    // );
  });

  it('/inventory unauthorized (GET)', () => {
    return request(app.getHttpServer()).get('/inventory').expect(401);
  });

  it('should create and read inventory for the authenticated user only', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/inventory')
      .set('Cookie', `${aliceToken}`)
      .send({ name: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.name).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');

    const listResponse = await request(app.getHttpServer())
      .get('/inventory')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0][0].name).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(listResponse.body[0][0].amount)).toBe('5');
  });

  it('should enforce RLS isolation between two users', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.rls',
      'Password123',
    );
    const bobToken = await registerAndLogin(
      app,
      'bob.inventory.rls',
      'Password123',
    );
    await request(app.getHttpServer())
      .post('/inventory')
      .set('Cookie', aliceToken)
      .send({ name: 'Alice item', amount: '1' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/inventory')
      .set('Cookie', bobToken)
      .send({ name: 'Bob item', amount: '2' })
      .expect(201);

    const aliceList = await request(app.getHttpServer())
      .get('/inventory')
      .set('Cookie', aliceToken)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(aliceList.body[0]).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(aliceList.body[1]).toBe(1);

    const bobList = await request(app.getHttpServer())
      .get('/inventory')
      .set('Cookie', bobToken)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(bobList.body[0]).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(bobList.body[1]).toBe(1);
  });
  it('should only return 10 items', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 15;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
  });
  it('default sort by new', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe(
        (numberOfItems - i - 1).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by old', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory?sort=old')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by name asc', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory?sort=name asc')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by name desc', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory?sort=name desc')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe(
        (numberOfItems - i - 1).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by amount asc', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: i })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe(i.toString());
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory?sort=amount asc')
      .set('Cookie', `${aliceToken}`)
      .expect(200);
    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe(i.toString());
    }
  });
  it('sort by amount desc', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: i })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe(i.toString());
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory?sort=amount desc')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe(
        (numberOfItems - i - 1).toString(),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe(
        (numberOfItems - i - 1).toString(),
      );
    }
  });
  it('sort by amount asc tiebreaker', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');

      const createResponse2 = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: (numberOfItems + i).toString(), amount: 2 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse2.body.name).toBe((numberOfItems + i).toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse2.body.amount)).toBe('2');
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory?sort=amount asc')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('1');
    }
  });
  it('sort by amount desc tiebreaker', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 10;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');

      const createResponse2 = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: (numberOfItems + i).toString(), amount: 2 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse2.body.name).toBe((numberOfItems + i).toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse2.body.amount)).toBe('2');
    }
    const listResponse = await request(app.getHttpServer())
      .get('/inventory?sort=amount desc')
      .set('Cookie', `${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0]).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0][i].name).toBe((i + numberOfItems).toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(listResponse.body[0][i].amount)).toBe('2');
    }
  });
  it('pagination', async () => {
    const aliceToken = await registerAndLogin(
      app,
      'alice.inventory.test',
      'Password123',
    );
    const numberOfItems = 100;
    for (let i = 0; i < numberOfItems; i++) {
      const createResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Cookie', `${aliceToken}`)
        .send({ name: i.toString(), amount: 1 })
        .expect(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createResponse.body.name).toBe(i.toString());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(String(createResponse.body.amount)).toBe('1');
    }
    for (let i = 0; i < Math.ceil(numberOfItems / 10); i++) {
      const listResponse = await request(app.getHttpServer())
        .get('/inventory?page=' + (i + 1))
        .set('Cookie', `${aliceToken}`)
        .expect(200);
      expect(listResponse.body).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(listResponse.body[0]).toHaveLength(10);
      for (let j = 0; j < 10; j++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(listResponse.body[0][j].name).toBe(
          (numberOfItems - (i * 10 + j + 1)).toString(),
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(String(listResponse.body[0][j].amount)).toBe('1');
      }
    }
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
    await app.close();
  });
});
