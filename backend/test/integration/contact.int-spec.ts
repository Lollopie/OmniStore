import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '../../src/config/app.config';
import emailConfig from '../../src/config/email.config';
import dbConfig from '../../src/config/db.config';
import { MailService } from '../../src/mail/mail.service';
import { DataSource, EntityManager } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../src/user/user.entity';
import { InviteEntity } from '../../src/invite/invite.entity';
import { ClsService } from 'nestjs-cls';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import authConfig from '../../src/config/auth.config';
import { InventoryEntity } from '../../src/inventory/inventory.entity';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import { UserWarehouseRoleEntity } from '../../src/userWarehouseRole/userWarehouseRole.entity';
import { OrganizationEntity } from '../../src/organization/organization.entity';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
import { ContactEntity } from '../../src/contact/contact.entity';
import { ContactController } from '../../src/contact/contact.controller';
import { ContactService } from '../../src/contact/contact.service';

describe('Contact', () => {
  let contactController: ContactController;
  let contactService: ContactService;
  let dataSource: DataSource;
  let entityManager: EntityManager;
  let testingModule: TestingModule;
  const mockMailService = {
    sendContactEmail: jest.fn(),
  };
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
      controllers: [ContactController],
      providers: [
        ContactService,
        TxRepoProvider,
        { provide: ClsService, useValue: mockClsService },
        { provide: MailService, useValue: mockMailService },
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
    }).compile();

    contactController = testingModule.get<ContactController>(ContactController);
    contactService = testingModule.get<ContactService>(ContactService);
    dataSource = testingModule.get<DataSource>(DataSource);
    entityManager = dataSource.createEntityManager();
  });
  it('should be defined', () => {
    expect(contactController).toBeDefined();
    expect(contactService).toBeDefined();
  });
  describe('send contact message', () => {
    it('should save the contact message and send a notification', async () => {
      await contactController.postMessage({
        fName: 'John',
        lName: 'Doe',
        email: 'example@example.org',
        message: 'Hello, this is a test message.',
      });
      const contactMessage = await dataSource
        .getRepository(ContactEntity)
        .findOne({ where: { email: 'example@example.org' } });
      expect(contactMessage).toBeDefined();
      expect(contactMessage).toMatchObject({
        fName: 'John',
        lName: 'Doe',
        email: 'example@example.org',
        message: 'Hello, this is a test message.',
      });
      expect(mockMailService.sendContactEmail).toHaveBeenCalled();
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
