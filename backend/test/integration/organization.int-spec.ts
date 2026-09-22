import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from '../../src/organization/organization.controller';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ClsService } from 'nestjs-cls';
import { DataSource, EntityManager } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import emailConfig from '../../src/config/email.config';
import { AuthGuard } from '../../src/auth/auth.guard';
import { CanActivate } from '@nestjs/common';
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
import { OrganizationService } from '../../src/organization/organization.service';
import { UserOrganizationRoleService } from '../../src/userOrganizationRole/userOrganizationRole.service';
import { RegisterController } from '../../src/register/register.controller';
import { RegisterService } from '../../src/register/register.service';
import { InviteService } from '../../src/invite/invite.service';
import { MailService } from '../../src/mail/mail.service';
import { VerificationEmailContext } from '../../src/mail/interfaces/mail-contexts.interface';
import { Response } from 'express';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { ScenarioBuilder } from '../e2e/utils/scenarioBuilder';
describe('Organization (Int)', () => {
  let organizationController: OrganizationController;
  let registerController: RegisterController;
  let entityManager: EntityManager;
  let dataSource: DataSource;
  let testingModule: TestingModule;
  let orgId: string;
  const mockClsService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'entityManager') {
        return entityManager;
      }
      if (key === 'orgId') {
        return orgId;
      }
      throw new Error(`Unexpected key: ${key}`);
    }),
  };
  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  beforeEach(async () => {
    jest.clearAllMocks();
    testingModule = await Test.createTestingModule({
      controllers: [OrganizationController, RegisterController],
      providers: [
        TxRepoProvider,
        AuthService,
        OrganizationService,
        UserOrganizationRoleService,
        RegisterService,
        InviteService,
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
      .overrideGuard(OrganizationRolesGuard)
      .useValue(MockGuard)
      .compile();

    organizationController = testingModule.get<OrganizationController>(
      OrganizationController,
    );
    registerController =
      testingModule.get<RegisterController>(RegisterController);
    dataSource = testingModule.get<DataSource>(DataSource);
    entityManager = dataSource.createEntityManager();
  });
  it('should be defined', () => {
    expect(organizationController).toBeDefined();
  });
  describe('register', () => {
    it('should create new org', async () => {
      await registerController.register({ email: 'test@example.org' });
      const verificationEmailContext: VerificationEmailContext =
        mockMailService.sendVerificationEmail.mock.calls[0][1];
      const token = verificationEmailContext.verificationUrl.split('token=')[1];
      const orgData = {
        name: 'Test Organization',
        ownerEmail: 'test@example.org',
        ownerUsername: 'testuser',
        ownerPassword: 'password123',
      };
      const response = await organizationController.register(token, orgData, {
        cookie: jest.fn(),
      } as unknown as Response);
      expect(response).toEqual({
        message: 'Organization created successfully.',
      });
      const user = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { email: 'test@example.org' } });
      expect(user).toBeDefined();
      expect(user.username).toEqual('testuser');
      expect(user.password).not.toEqual('password123');
      expect(user.userId).toBeDefined();
      const org = await dataSource
        .getRepository(OrganizationEntity)
        .findOne({ where: { name: 'Test Organization' } });
      expect(org).toBeDefined();
      expect(org.orgId).toBeDefined();
      const userOrgRole = await dataSource
        .getRepository(UserOrganizationRoleEntity)
        .findOne({ where: { userId: user.userId, orgId: org.orgId } });
      expect(userOrgRole).toBeDefined();
      expect(userOrgRole.role).toEqual(OrganizationRole.OWNER);
    });
  });
  describe('getUsers', () => {
    it('should return users in org', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withUser('User1', 'owner', undefined, undefined))
        .then((b) => b.withUser('User2', 'admin', undefined, undefined));
      orgId = scenarioBuilder['org'].orgId;
      const users = await organizationController.getUsers('', 1);
      expect(users.data[0].username).toEqual('User1');
      expect(users.data[1].username).toEqual('User2');
      expect(users.data[0].role).toEqual(OrganizationRole.OWNER);
      expect(users.data[1].role).toEqual(OrganizationRole.ADMIN);
      expect(users.total).toEqual(2);
    });
  });
  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withUser('User1', 'owner', undefined, undefined))
        .then((b) => b.withUser('User2', 'admin', undefined, undefined));
      orgId = scenarioBuilder['org'].orgId;
      const updatedRole = await organizationController.updateUserRole({
        username: 'User2',
        role: OrganizationRole.OWNER,
      });
      expect(updatedRole.role).toEqual(OrganizationRole.OWNER);
      const userOrgRole = await dataSource
        .getRepository(UserOrganizationRoleEntity)
        .findOne({
          where: {
            userId: scenarioBuilder['users']['User2'].userId,
            orgId: orgId,
          },
        });
      expect(userOrgRole.role).toEqual(OrganizationRole.OWNER);
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
