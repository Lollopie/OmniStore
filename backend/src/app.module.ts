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
import { CreateUserTable1782066103000 } from './migrations/1782066103000-CreateUserTable';
import { CreateInventoryTable1782066151000 } from './migrations/1782066151000-CreateInventoryTable';
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
import { CreateWarehouseTable1783438313000 } from './migrations/1783438313000-CreateWarehouseTable';
import { CreateUserWarehouseRoleTable1783439080000 } from './migrations/1783439080000-CreateUserWarehouseRoleTable';
import emailConfig from './config/email.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail/mail.service';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { OrganizationEntity } from './organization/organization.entity';
import { UserOrganizationRoleEntity } from './userOrganizationRole/userOrganizationRole.entity';
import { CreateOrganizationTable1786209916000 } from './migrations/1786209916000-CreateOrganizationTable';
import { CreateUserOrganizationRoleTable1786210080000 } from './migrations/1786210080000-CreateUserOrganizationRoleTable';
import { CreateInviteTable1786210196000 } from './migrations/1786210196000-CreateInviteTable';
import { RlsInterceptor } from './rls/rls.interceptor';
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
          migrations: [
            CreateUserTable1782066103000,
            CreateInventoryTable1782066151000,
            CreateWarehouseTable1783438313000,
            CreateUserWarehouseRoleTable1783439080000,
            CreateOrganizationTable1786209916000,
            CreateUserOrganizationRoleTable1786210080000,
            CreateInviteTable1786210196000,
          ],
          migrationsRun: true,
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
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: RlsInterceptor },
  ],
})
export class AppModule {}
