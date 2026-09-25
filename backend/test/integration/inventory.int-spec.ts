import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from '../../src/inventory/inventory.controller';
import { InventoryService } from '../../src/inventory/inventory.service';
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
import { ContactEntity } from '../../src/contact/contact.entity';
describe('Inventory (Int)', () => {
  let inventoryController: InventoryController;
  let entityManager: EntityManager;
  let dataSource: DataSource;
  let testingModule: TestingModule;
  let warehouseId: string;
  const mockClsService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'entityManager') {
        return entityManager;
      }
      if (key === 'warehouseId') {
        return warehouseId;
      }
      throw new Error(`Unexpected key: ${key}`);
    }),
  };
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  beforeEach(async () => {
    jest.clearAllMocks();
    testingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        InventoryService,
        TxRepoProvider,
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
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(MockGuard)
      .overrideGuard(WarehouseRolesGuard)
      .useValue(MockGuard)
      .overrideGuard(OrganizationRolesGuard)
      .useValue(MockGuard)
      .compile();

    inventoryController =
      testingModule.get<InventoryController>(InventoryController);
    dataSource = testingModule.get<DataSource>(DataSource);
    entityManager = dataSource.createEntityManager();
  });
  it('should be defined', () => {
    expect(inventoryController).toBeDefined();
  });
  describe('getInventory', () => {
    it('should return inventory items', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withInventory('Warehouse1', 'Item1', 10))
        .then((b) => b.withInventory('Warehouse1', 'Item2', 10));
      warehouseId = scenarioBuilder['warehouses']['Warehouse1'].warehouseId;
      const inventory = await inventoryController.getInventory(
        undefined,
        undefined,
        undefined,
      );
      expect(inventory[0].length).toBe(2);
      expect(inventory[0][0].itemName).toBe('Item2');
      expect(inventory[0][1].itemName).toBe('Item1');
      expect(inventory[0][0].amount).toBe(10);
      expect(inventory[0][1].amount).toBe(10);
      expect(inventory[1]).toBe(2);
    });
  });
  describe('addItem', () => {
    it('should add an item to inventory', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'));
      warehouseId = scenarioBuilder['warehouses']['Warehouse1'].warehouseId;
      const newItem = {
        itemName: 'newItem',
        amount: '5',
      };
      const addedItem = await inventoryController.addItem(newItem);
      expect(addedItem.itemName).toBe('newItem');
      expect(addedItem.amount).toBe(5);
      await dataSource
        .query(`SELECT * FROM "inventory" WHERE "item_name" = 'newItem'`)
        .then((result) => {
          expect(result.length).toBe(1);
          expect(result[0].item_name).toBe('newItem');
          expect(result[0].amount).toBe(5);
        });
    });
  });
  describe('updateItem', () => {
    it('should update an item', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withInventory('Warehouse1', 'Item1', 10));
      warehouseId = scenarioBuilder['warehouses']['Warehouse1'].warehouseId;
      const item = scenarioBuilder['inventory']['Item1'];
      const newItem = {
        ...item,
        itemName: 'newItem',
        amount: '5',
      };
      const addedItem = await inventoryController.updateItem(newItem);
      expect(addedItem.itemName).toBe('newItem');
      expect(addedItem.amount).toBe(5);
      await dataSource
        .query(`SELECT * FROM "inventory" WHERE "item_name" = 'newItem'`)
        .then((result) => {
          expect(result.length).toBe(1);
          expect(result[0].item_id).toBe(item.itemId);
          expect(result[0].item_name).toBe('newItem');
          expect(result[0].amount).toBe(5);
        });
    });
  });
  describe('delete', () => {
    it('should delete an item', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withInventory('Warehouse1', 'Item1', 10));
      warehouseId = scenarioBuilder['warehouses']['Warehouse1'].warehouseId;
      const item = scenarioBuilder['inventory']['Item1'];
      const newItem = {
        ...item,
        amount: item.amount.toString(),
      };
      const addedItem = await inventoryController.deleteItem(newItem);
      expect(addedItem.message).toBe('Item has been deleted.');
      await dataSource
        .query(`SELECT * FROM "inventory" WHERE "item_name" = 'Item1'`)
        .then((result) => {
          expect(result.length).toBe(0);
        });
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
