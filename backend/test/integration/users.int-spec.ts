import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/user/users.controller';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ClsService } from 'nestjs-cls';
import { DataSource, EntityManager } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import emailConfig from '../../src/config/email.config';
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
import { ScenarioBuilder } from '../e2e/utils/scenarioBuilder';
import { Cookie } from '../../src/user/user.decorator';
import { UsersService } from '../../src/user/users.service';
import { Response } from 'express';
describe('Users (Int)', () => {
  let usersController: UsersController;
  let authService: AuthService;
  let entityManager: EntityManager;
  let dataSource: DataSource;
  let testingModule: TestingModule;
  const mockClsService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'entityManager') {
        return entityManager;
      }
      throw new Error(`Unexpected key: ${key}`);
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    testingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        TxRepoProvider,
        AuthService,
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
    }).compile();

    usersController = testingModule.get<UsersController>(UsersController);
    authService = testingModule.get<AuthService>(AuthService);
    dataSource = testingModule.get<DataSource>(DataSource);
    entityManager = dataSource.createEntityManager();
  });
  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });
  describe('updatePassword', () => {
    it('should update the password', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withUser('User1', 'owner', undefined, undefined));
      const user = scenarioBuilder['users']['User1'];
      const response = await usersController.updatePassword(
        {
          password: 'password1',
          newPassword: 'newPassword1',
          confirmPassword: 'newPassword1',
        },
        {
          userId: user.userId,
        } as unknown as Cookie,
      );
      expect(response).toEqual({ message: 'Password updated successfully' });
      const updatedUser = await dataSource.getRepository(UserEntity).findOne({
        where: { userId: user.userId },
      });
      expect(updatedUser).toBeDefined();
      expect(updatedUser.password).not.toEqual(user.password);
      expect(updatedUser.password).not.toEqual('newPassword1');
      await expect(
        authService.verifyPassword('newPassword1', updatedUser.password),
      ).resolves.toBe(true);
    });
  });
  describe('deleteAccount', () => {
    it('should delete the account', async () => {
      const scenarioBuilder = await ScenarioBuilder.create(dataSource)
        .withOrganization('Org1')
        .then((b) => b.withUser('User1', 'owner', undefined, undefined));
      const user = scenarioBuilder['users']['User1'];
      const response = await usersController.deleteAccount(
        { password: 'password1' },
        {
          userId: user.userId,
        } as unknown as Cookie,
        {
          clearCookie: jest.fn(),
        } as unknown as Response,
      );
      expect(response).toEqual({ message: 'Account deleted successfully' });
      const deletedUser = await dataSource.getRepository(UserEntity).findOne({
        where: { userId: user.userId },
      });
      expect(deletedUser).toBeNull();
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
