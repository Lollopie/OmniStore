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
import { UserBaseEntity } from './user/user-base.entity';
import { InventoryEntity } from './inventory/inventory.entity';
import { InventoryModule } from './inventory/inventory.module';
import { CreateUserTable1782066103000 } from './migrations/1782066103000-CreateUserTable';
import { CreateInventoryTable1782066151000 } from './migrations/1782066151000-CreateInventoryTable';
import { AuthController } from './auth/auth.controller';
import { LogoutController } from './logout/logout.controller';
import { HealthController } from './health/health.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { UserWarehouseRoleModule } from './userWarehouseRole/userWarehouseRole.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { WarehouseEntity } from './warehouse/warehouse.entity';
import { UserWarehouseRoleEntity } from './userWarehouseRole/userWarehouseRole.entity';
import { CreateWarehouseTable1783438313000 } from './migrations/1783438313000-CreateWarehouseTable';
import { InventoryRefactoring1783438667000 } from './migrations/1783438667000-InventoryRefactoring';
import { CreateUserWarehouseRoleTable1783439080000 } from './migrations/1783439080000-CreateUserWarehouseRoleTable';
import { AddRLSUserWarehouseRole1784213959000 } from './migrations/1784213959000-AddRLSUserWarehouseRole';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env`,
        `.env.${process.env.NODE_ENV || 'dev'}`,
        '/etc/secrets/.env',
      ],
      load: [authConfig, dbConfig],
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
            UserBaseEntity,
            InventoryEntity,
            WarehouseEntity,
            UserWarehouseRoleEntity,
          ],
          synchronize: configService.get<boolean>('db.databaseSynchronize'),
          migrations: [
            CreateUserTable1782066103000,
            CreateInventoryTable1782066151000,
            CreateWarehouseTable1783438313000,
            InventoryRefactoring1783438667000,
            CreateUserWarehouseRoleTable1783439080000,
            AddRLSUserWarehouseRole1784213959000,
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
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true }, // Automatically sets up storage per express request
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
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
  ],
})
export class AppModule {}
