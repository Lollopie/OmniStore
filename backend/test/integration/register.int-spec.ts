import { Test, TestingModule } from '@nestjs/testing';
import { RegisterController } from '../../src/register/register.controller';
import { RegisterService } from '../../src/register/register.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import emailConfig from '../../src/config/email.config';
import dbConfig from '../../src/config/db.config';
import { MailService } from '../../src/mail/mail.service';
import { InviteService } from '../../src/invite/invite.service';
import { DataSource, EntityManager } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../src/user/user.entity';
import { InviteEntity } from '../../src/invite/invite.entity';
import { ClsService } from 'nestjs-cls';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { AuthService } from '../../src/auth/auth.service';
import { VerificationEmailContext } from '../../src/mail/interfaces/mail-contexts.interface';
import authConfig from '../../src/config/auth.config';
import { JwtService } from '@nestjs/jwt';
import { InventoryEntity } from '../../src/inventory/inventory.entity';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import { UserWarehouseRoleEntity } from '../../src/userWarehouseRole/userWarehouseRole.entity';
import { OrganizationEntity } from '../../src/organization/organization.entity';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
import { ContactEntity } from '../../src/contact/contact.entity';

describe('Register', () => {
  let registerController: RegisterController;
  let registerService: RegisterService;
  let dataSource: DataSource;
  let entityManager: EntityManager;
  let testingModule: TestingModule;
  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };
  const mockJwtService = {};
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
      controllers: [RegisterController],
      providers: [
        RegisterService,
        InviteService,
        TxRepoProvider,
        AuthService,
        { provide: ClsService, useValue: mockClsService },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
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
              username: configService.get<string>('db.databaseUser'),
              password: configService.get<string>('db.databasePassword'),
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
    }).compile();

    registerController =
      testingModule.get<RegisterController>(RegisterController);
    registerService = testingModule.get<RegisterService>(RegisterService);
    dataSource = testingModule.get<DataSource>(DataSource);
    entityManager = dataSource.createEntityManager();
  });
  it('should be defined', () => {
    expect(registerController).toBeDefined();
    expect(registerService).toBeDefined();
  });
  describe('register', () => {
    it('should create invite and verify token', async () => {
      await registerController.register({ email: 'example@example.org' });
      const invite = await dataSource
        .getRepository(InviteEntity)
        .findOne({ where: { email: 'example@example.org' } });
      expect(invite).toBeDefined();
      const context: VerificationEmailContext =
        mockMailService.sendVerificationEmail.mock.calls[0][1];
      const rawToken = context.verificationUrl.split('token=')[1];
      const verifyResponse = await registerController.verifyToken(rawToken);
      expect(verifyResponse).toEqual({
        valid: true,
        email: 'example@example.org',
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
    await testingModule.close();
  });
});
