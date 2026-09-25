import { Test, TestingModule } from '@nestjs/testing';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ClsService } from 'nestjs-cls';
import { DataSource, EntityManager } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import emailConfig from '../../src/config/email.config';
import { ScenarioBuilder } from '../e2e/utils/scenarioBuilder';
import { AuthGuard } from '../../src/auth/auth.guard';
import { CanActivate } from '@nestjs/common';
import { WarehouseRolesGuard } from '../../src/roles/warehouseRoles/warehouseRoles.guard';
import { OrganizationRolesGuard } from '../../src/roles/organizationRoles/organizationRoles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../src/user/user.entity';
import { InventoryEntity } from '../../src/inventory/inventory.entity';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import { UserWarehouseRoleEntity } from '../../src/userWarehouseRole/userWarehouseRole.entity';
import { OrganizationEntity } from '../../src/organization/organization.entity';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
import { InviteEntity } from '../../src/invite/invite.entity';
import { WarehouseController } from '../../src/warehouse/warehouse.controller';
import { WarehouseService } from '../../src/warehouse/warehouse.service';
import { MailService } from '../../src/mail/mail.service';
import { UserWarehouseRoleService } from '../../src/userWarehouseRole/userWarehouseRole.service';
import { InviteService } from '../../src/invite/invite.service';
import { AuthService } from '../../src/auth/auth.service';
import { OrganizationService } from '../../src/organization/organization.service';
import { Cookie } from '../../src/user/user.decorator';
import { Response } from 'express';
import { UsersService } from '../../src/user/users.service';
import { JwtModule } from '@nestjs/jwt';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
import { ContactEntity } from '../../src/contact/contact.entity';
describe('Warehouse (Int)', () => {
  let warehouseController: WarehouseController;
  let entityManager: EntityManager;
  let dataSource: DataSource;
  let testingModule: TestingModule;
  let warehouseId: string;
  let orgId: string;
  const mockClsService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'entityManager') {
        return entityManager;
      }
      if (key === 'warehouseId') {
        return warehouseId;
      }
      if (key === 'orgId') {
        return orgId;
      }
      if (key === 'warehouseRole') {
        return 'admin';
      }
      throw new Error(`Unexpected key: ${key}`);
    }),
  };
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  const mockMailService = {};
  const mockInviteService = {};
  const mockOrganizationService = {};
  beforeEach(async () => {
    jest.clearAllMocks();
    testingModule = await Test.createTestingModule({
      controllers: [WarehouseController],
      providers: [
        WarehouseService,
        TxRepoProvider,
        UserWarehouseRoleService,
        AuthService,
        UsersService,
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: InviteService, useValue: mockInviteService },
        { provide: MailService, useValue: mockMailService },
        { provide: ClsService, useValue: mockClsService },
      ],
      imports: [
        await ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [
            `.env.${process.env.NODE_ENV || 'test'}`,
            `.env`,
            '/etc/secrets/.env',
          ],
          load: [appConfig, authConfig, dbConfig, emailConfig],
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return {
              type: 'postgres',
              host: configService.get<string>('db.databaseHost'),
              port: configService.get<number>('db.databasePort'),
              username: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              database: configService.get<string>('db.databaseName'),
              entities: [
                UserEntity,
                InventoryEntity,
                WarehouseEntity,
                UserWarehouseRoleEntity,
                OrganizationEntity,
                UserOrganizationRoleEntity,
                InviteEntity,
                ContactEntity,
              ],
              synchronize: configService.get<boolean>('db.databaseSynchronize'),
              migrationsRun: false,
            };
          },
        }),
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
    })
      .overrideGuard(AuthGuard)
      .useValue(MockGuard)
      .overrideGuard(WarehouseRolesGuard)
      .useValue(MockGuard)
      .overrideGuard(OrganizationRolesGuard)
      .useValue(MockGuard)
      .compile();

    warehouseController =
      testingModule.get<WarehouseController>(WarehouseController);
    dataSource = testingModule.get<DataSource>(DataSource);
    entityManager = dataSource.createEntityManager();
  });
  it('should be defined', () => {
    expect(warehouseController).toBeDefined();
  });
  describe('create', () => {
    it('should create warehouse', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withUser('User1', 'owner', undefined, undefined));
      orgId = scenarioBuilder['org'].orgId;
      const user = scenarioBuilder['users']['User1'];
      const warehouse = await warehouseController.create(
        {
          warehouseName: 'Warehouse1',
        },
        {
          userId: user.userId,
          username: user.username,
        } as unknown as Cookie,
        {
          cookie: jest.fn(),
        } as unknown as Response,
      );
      expect(warehouse).toBeDefined();
      expect(warehouse['error']).not.toBeDefined();
      expect(warehouse?.name).toBe('Warehouse1');
      expect(warehouse?.warehouseId).toBeDefined();
      expect(warehouse?.role).toBe('admin');
    });
  });
  describe('select', () => {
    it('should select warehouse', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withWarehouse('Warehouse2'))
        .then((b) =>
          b.withUser(
            'User1',
            'owner',
            ['Warehouse1', 'Warehouse2'],
            ['admin', 'manager'],
          ),
        );
      const user = scenarioBuilder['users']['User1'];
      const warehouse2 = scenarioBuilder['warehouses']['Warehouse2'];
      const warehouse = await warehouseController.select(
        {
          warehouseId: warehouse2.warehouseId,
        },
        {
          userId: user.userId,
          username: user.username,
        } as unknown as Cookie,
        {
          cookie: jest.fn(),
        } as unknown as Response,
      );
      expect(warehouse).toBeDefined();
      expect(warehouse['error']).not.toBeDefined();
      expect(warehouse?.activeRole).toBe('manager');
    });
  });
  describe('get', () => {
    it('should return warehouse users', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withUser('User1', 'owner', ['Warehouse1'], ['admin']))
        .then((b) => b.withUser('User2', 'owner', ['Warehouse1'], ['manager']));
      const warehouse = scenarioBuilder['warehouses']['Warehouse1'];
      warehouseId = warehouse.warehouseId;
      const warehouseUsers = await warehouseController.get(1, '');
      expect(warehouseUsers).toBeDefined();
      expect(warehouseUsers.data).toHaveLength(2);
      expect(warehouseUsers.data[0].username).toBe('User1');
      expect(warehouseUsers.data[0].role).toBe('admin');
      expect(warehouseUsers.data[1].username).toBe('User2');
      expect(warehouseUsers.data[1].role).toBe('manager');
      expect(warehouseUsers.total).toBe(2);
    });
  });
  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withUser('User1', 'owner', ['Warehouse1'], ['admin']))
        .then((b) => b.withUser('User2', 'owner', ['Warehouse1'], ['manager']));
      const user2 = scenarioBuilder['users']['User2'];
      const warehouse = scenarioBuilder['warehouses']['Warehouse1'];
      warehouseId = warehouse.warehouseId;
      const updatedRole = await warehouseController.updateUserRole({
        username: user2.username,
        role: WarehouseRole.ADMIN,
      });
      expect(updatedRole).toBeDefined();
      expect(updatedRole.userId).toBe(user2.userId);
      expect(updatedRole.warehouseId).toBe(warehouse.warehouseId);
      expect(updatedRole.role).toBe('admin');
      const updatedRoleFromDb = await dataSource
        .getRepository(UserWarehouseRoleEntity)
        .findOne({
          where: {
            userId: user2.userId,
            warehouseId: warehouse.warehouseId,
          },
        });
      expect(updatedRoleFromDb).toBeDefined();
      expect(updatedRoleFromDb?.role).toBe('admin');
    });
  });
  describe('addUserToWarehouse', () => {
    it('should add the user to the warehouse', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withUser('User1', 'owner', ['Warehouse1'], ['admin']))
        .then((b) => b.withUser('User2', 'owner', [], []));
      const warehouse = scenarioBuilder['warehouses']['Warehouse1'];
      orgId = scenarioBuilder['org'].orgId;
      warehouseId = warehouse.warehouseId;
      const user2 = scenarioBuilder['users']['User2'];
      const newRole = await warehouseController.addUserToWarehouse({
        username: user2.username,
        role: WarehouseRole.MANAGER,
      });
      expect(newRole).toBeDefined();
      expect(newRole.userId).toBe(user2.userId);
      expect(newRole.warehouseId).toBe(warehouse.warehouseId);
      expect(newRole.role).toBe('manager');
      const newRoleFromDb = await dataSource
        .getRepository(UserWarehouseRoleEntity)
        .findOne({
          where: {
            userId: user2.userId,
            warehouseId: warehouse.warehouseId,
          },
        });
      expect(newRoleFromDb).toBeDefined();
      expect(newRoleFromDb.role).toBe('manager');
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
    await dataSource.destroy();
    await testingModule.close();
  });
});
