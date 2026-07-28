import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CanActivate, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../src/config/auth.config';
import dbConfig from '../src/config/db.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
@Injectable()
class MockThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
describe('RoleGuard (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  beforeEach(async () => {
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
              expiresIn: 1,
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
    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });
  it('RoleGuard no warehouse', async () => {
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
    const roleGuardResponse = await request(app.getHttpServer())
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .expect(400);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(roleGuardResponse.body.message).toBe('No active Warehouse found');
  });
  it('RoleGuard non-existent warehouse', async () => {
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
    const token: {
      user_id: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = jwtService.decode(
      response.headers['set-cookie'][0].split('token=')[1].split(';')[0],
    );
    const newToken: {
      user_id: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = {
      user_id: token.user_id,
      username: token.username,
      activeWarehouseId: '019fa8c5-6daa-73cb-bcdd-c6d56fb5ae05',
      activeRole: 'admin',
    };
    const roleGuardResponse = await request(app.getHttpServer())
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .set('Cookie', `token=${jwtService.sign(newToken)}`)
      .expect(400);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(roleGuardResponse.body.message).toBe('Active Warehouse not found');
  });
  it('RoleGuard with permission', async () => {
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
      .send({
        warehouseName: 'Warehouse 1',
      })
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .expect(201);
    await request(app.getHttpServer())
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(201);
  });
  it('RoleGuard without role in warehouse', async () => {
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
    const response2 = await request(app.getHttpServer())
      .post('/login')
      .send({
        username: 'username2',
        password: 'password1',
      })
      .expect(200);
    const warehouseResponse = await request(app.getHttpServer())
      .post('/warehouse')
      .send({
        warehouseName: 'Warehouse 1',
      })
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .expect(201);
    const token: {
      user_id: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = jwtService.decode(
      response2.headers['set-cookie'][0].split('token=')[1].split(';')[0],
    );
    const newToken: {
      user_id: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = {
      user_id: token.user_id,
      username: token.username,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      activeWarehouseId: warehouseResponse.body.warehouse_id,
      activeRole: 'admin',
    };
    const roleGuardResponse = await request(app.getHttpServer())
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .set('Cookie', `token=${jwtService.sign(newToken)}`)
      .expect(403);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(roleGuardResponse.body.message).toBe(
      'You do not have a role for the active warehouse',
    );
  });
  it('RoleGuard without permission', async () => {
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
      .send({
        warehouseName: 'Warehouse 1',
      })
      .set('Cookie', `${response.headers['set-cookie'][0].split(';')[0]}`)
      .expect(201);
    await request(app.getHttpServer())
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
    const roleGuardResponse = await request(app.getHttpServer())
      .post('/inventory')
      .send({
        itemName: 'Apple',
        amount: '1',
      })
      .set(
        'Cookie',
        `${warehouseResponse.headers['set-cookie'][0].split(';')[0]}`,
      )
      .expect(403);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(roleGuardResponse.body.message).toBe(
      'You do not have the required role to access this resource',
    );
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
