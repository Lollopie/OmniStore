import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';

describe('RegisterController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setViewEngine('hbs');
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  it('/register (GET)', () => {
    return request(app.getHttpServer()).get('/register').expect(200);
  });
  it('/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/register')
      .send({ username: 'test', password: 'test' })
      .expect(201);
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
