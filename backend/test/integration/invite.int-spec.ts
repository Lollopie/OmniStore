import { Test, TestingModule } from '@nestjs/testing';
import { InviteController } from '../../src/invite/invite.controller';
import { InviteService } from '../../src/invite/invite.service';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ClsService } from 'nestjs-cls';
import { DataSource, EntityManager } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import emailConfig from '../../src/config/email.config';
import { WarehouseController } from '../../src/warehouse/warehouse.controller';
import { WarehouseService } from '../../src/warehouse/warehouse.service';
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
import { AuthService } from '../../src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from '../../src/mail/mail.service';
import { UserWarehouseRoleService } from '../../src/userWarehouseRole/userWarehouseRole.service';
import { OrganizationService } from '../../src/organization/organization.service';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
import { InviteContext } from '../../src/mail/interfaces/mail-contexts.interface';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
describe('Invite (Int)', () => {
  let inviteController: InviteController;
  let warehouseController: WarehouseController;
  let entityManager: EntityManager;
  let dataSource: DataSource;
  let testingModule: TestingModule;
  let warehouseId: string;
  let orgId: string;
  const mockMailService = {
    sendInviteEmail: jest.fn().mockResolvedValue(true),
  };
  const mockUserWarehouseRoleService = {};
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
      if (key === 'orgRole') {
        return 'owner';
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
      controllers: [InviteController, WarehouseController],
      providers: [
        InviteService,
        TxRepoProvider,
        AuthService,
        WarehouseService,
        OrganizationService,
        {
          provide: UserWarehouseRoleService,
          useValue: mockUserWarehouseRoleService,
        },
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

    inviteController = testingModule.get<InviteController>(InviteController);
    warehouseController =
      testingModule.get<WarehouseController>(WarehouseController);
    dataSource = testingModule.get<DataSource>(DataSource);
    entityManager = dataSource.createEntityManager();
  });
  it('should be defined', () => {
    expect(inviteController).toBeDefined();
  });
  describe('acceptInvite', () => {
    it('should create new user', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withWarehouse('Warehouse1'))
        .then((b) => b.withUser('User1', 'Org1', ['Warehouse1'], ['admin']));
      warehouseId = scenarioBuilder['warehouses']['Warehouse1'].warehouseId;
      orgId = scenarioBuilder['org'].orgId;
      await warehouseController.inviteUser({
        email: 'test@example.org',
        role: WarehouseRole.ADMIN,
      });
      const inviteContext: InviteContext =
        mockMailService.sendInviteEmail.mock.calls[0][1];
      const token = inviteContext.verificationUrl.split('token=')[1];
      const newUser = await inviteController.acceptInvite(token, {
        username: 'newuser',
        password: 'password123',
      });
      expect(newUser.message).toBe('Invite accepted successfully');
      const user = await entityManager.findOne(UserEntity, {
        where: { username: 'newuser' },
      });
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.org');
      expect(user.username).toBe('newuser');
      expect(user.password).not.toBe('password123');
      const userWarehouseRole = await entityManager.findOne(
        UserWarehouseRoleEntity,
        {
          where: { userId: user.userId },
        },
      );
      expect(userWarehouseRole).toBeDefined();
      expect(userWarehouseRole.role).toBe(WarehouseRole.ADMIN);
      const userOrgRole = await entityManager.findOne(
        UserOrganizationRoleEntity,
        {
          where: { userId: user.userId },
        },
      );
      expect(userOrgRole).toBeDefined();
      expect([
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER,
      ]).toContain(userOrgRole.role);
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
