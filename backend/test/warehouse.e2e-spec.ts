import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('WarehouseController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [authConfig, dbConfig],
        }),
        AppModule,
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
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });
  it('Warehouse Create', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    expect(warehouseResponse.body).toEqual({
      name: 'Warehouse 1',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      warehouse_id: expect.any(String),
      role: 'admin',
    });
    expect(warehouseResponse.headers['set-cookie'][0]).toMatch(
      /token=.+; Max-Age=3600; Path=\/; Expires=.+; HttpOnly; SameSite=(?:Lax|None)/,
    );
  });
  it('Warehouse Select', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const selectResponse = await request(app.getHttpServer())
      .post('/warehouse/select')
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .send({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        id: warehouseResponse.body.warehouse_id,
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
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const getUsersResponse = await request(app.getHttpServer())
      .get('/warehouse/users')
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(getUsersResponse.body['total']).toEqual(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(getUsersResponse.body['data']).toEqual([
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user_id: expect.any(String),
        username: 'username',
        role: 'admin',
      },
    ]);
  });

  it('Warehouse post non-existent user', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const postUsersResponse = await request(app.getHttpServer())
      .post('/warehouse/users')
      .send({
        username: 'username2',
        role: 'admin',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(404);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(postUsersResponse.body.message).toEqual('User not found');
  });
  it('Warehouse post duplicate user', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const postUsersResponse = await request(app.getHttpServer())
      .post('/warehouse/users')
      .send({
        username: 'username',
        role: 'admin',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(409);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(postUsersResponse.body.message).toEqual(
      'User already belongs to this warehouse',
    );
  });
  it('Warehouse postUsers', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username2',
        password: 'password1',
      })
      .expect(201);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const postUsersResponse = await request(app.getHttpServer())
      .post('/warehouse/users')
      .send({
        username: 'username2',
        role: 'admin',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(201);
    expect(postUsersResponse.body).toEqual({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user_id: expect.any(String),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      warehouse_id: expect.any(String),
      role: 'admin',
    });
  });
  it('Warehouse patchUsers', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const patchUserResponse = await request(app.getHttpServer())
      .patch('/warehouse/users')
      .send({
        username: 'username',
        role: 'staff',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(200);
    expect(patchUserResponse.body).toEqual({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user_id: expect.any(String),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      warehouse_id: expect.any(String),
      role: 'staff',
    });
  });
  it('Warehouse patch non-existent user', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const patchUserResponse = await request(app.getHttpServer())
      .patch('/warehouse/users')
      .send({
        username: 'username2',
        role: 'staff',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(404);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(patchUserResponse.body.message).toEqual('User not found');
  });
  it('Warehouse patch user not in warehouse', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username2',
        password: 'password1',
      })
      .expect(201);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    const postUsersResponse = await request(app.getHttpServer())
      .patch('/warehouse/users')
      .send({
        username: 'username2',
        role: 'admin',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(404);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(postUsersResponse.body.message).toEqual(
      'User is not assigned to this warehouse',
    );
  });
  it('Warehouse getUsers search', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username',
        password: 'password1',
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/register')
      .send({
        username: 'username2',
        password: 'password1',
      })
      .expect(201);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .send({
        warehouseName: 'Warehouse 1',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/warehouse/users')
      .send({
        username: 'username2',
        role: 'admin',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(201);
    const getUsersResponse = await request(app.getHttpServer())
      .get('/warehouse/users?search=2')
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(getUsersResponse.body['total']).toEqual(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(getUsersResponse.body['data']).toEqual([
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user_id: expect.any(String),
        username: 'username2',
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
    await dataSource.destroy();
    await app.close();
  });
});
