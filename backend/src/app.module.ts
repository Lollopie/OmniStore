import { Module } from '@nestjs/common';
import { RegisterController } from './register/register.controller';
import { RegisterService } from './register/register.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
import { UsersModule } from './user/users.module';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';
import dbConfig from './config/db.config';
import { PasswordService } from './auth/password.service';
import { LoginModule } from './login/login.module';
import { ConfigService } from '@nestjs/config';
import { InventoryEntity } from './inventory/inventory.entity';
import { InventoryModule } from './inventory/inventory.module';
import { AuthController } from './auth/auth.controller';
import { LogoutController } from './logout/logout.controller';
import { HealthController } from './health/health.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { UserWarehouseRoleModule } from './userWarehouseRole/userWarehouseRole.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { WarehouseEntity } from './warehouse/warehouse.entity';
import { UserWarehouseRoleEntity } from './userWarehouseRole/userWarehouseRole.entity';
import emailConfig from './config/email.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail/mail.service';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { OrganizationEntity } from './organization/organization.entity';
import { UserOrganizationRoleEntity } from './userOrganizationRole/userOrganizationRole.entity';
import { RlsInterceptor } from './rls/rls.interceptor';
import { UserOrganizationRoleService } from './userOrganizationRole/userOrganizationRole.service';
import { OrganizationModule } from './organization/organization.module';
import { InviteService } from './invite/invite.service';
import { TxRepoProvider } from './rls/db.helper';
import { GuardDBService } from './utils/guardDB.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'dev'}`,
        `.env`,
        '/etc/secrets/.env',
      ],
      load: [authConfig, dbConfig, emailConfig],
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
          ],
          synchronize: configService.get<boolean>('db.databaseSynchronize'),
          migrationsRun: false,
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('db.rateTimeout')!,
            limit: config.get<number>('db.rateLimit')!,
          },
        ],
        storage: new ThrottlerStorageRedisService(
          config.get<string>('db.redisUrl'),
        ),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const user = config.get<string>('email.mailUser');
        const pass = config.get<string>('email.mailPassword');
        return {
          transport: {
            host: config.get<string>('email.mailHost'),
            port: config.get<number>('email.mailPort'),
            secure: config.get<boolean>('email.mailSecure', false),
            auth: user && pass ? { user, pass } : undefined,
          },
          defaults: {
            from: config.get<string>('email.mailFrom'),
          },
          template: {
            dir: join(__dirname, '/mail/templates'),
            adapter: new HandlebarsAdapter(
              {
                uppercase: (str: string) => str.toUpperCase(),
              },
              {},
            ),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    UsersModule,
    LoginModule,
    InventoryModule,
    UserWarehouseRoleModule,
    WarehouseModule,
    OrganizationModule,
  ],
  controllers: [
    RegisterController,
    AuthController,
    LogoutController,
    HealthController,
  ],
  providers: [
    RegisterService,
    PasswordService,
    MailService,
    UserOrganizationRoleService,
    InviteService,
    TxRepoProvider,
    GuardDBService,
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: RlsInterceptor },
  ],
})
export class AppModule {}
