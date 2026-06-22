import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';

type LoginResponse = {
  access_token: string;
};

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

  return (response.body as LoginResponse).access_token;
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
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ itemName: 'Apples', amount: '5' })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(createResponse.body.name).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(createResponse.body.amount)).toBe('5');

    const listResponse = await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0].name).toBe('Apples');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(String(listResponse.body[0].amount)).toBe('5');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0].user_id).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(listResponse.body[0].user_id).toBe(createResponse.body.user_id);
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
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ itemName: 'Alice item', amount: '1' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/inventory')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ itemName: 'Bob item', amount: '2' })
      .expect(201);

    const aliceList = await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(aliceList.body).toHaveLength(1);

    const bobList = await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    expect(bobList.body).toHaveLength(1);
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
