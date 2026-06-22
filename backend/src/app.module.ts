import { Module } from '@nestjs/common';
import { RegisterController } from './register/register.controller';
import { RegisterService } from './register/register.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { UsersModule } from './user/users.module';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';
import dbConfig from './config/db.config';
import { PasswordService } from './auth/password.service';
import { LoginModule } from './login/login.module';
import { ConfigService } from '@nestjs/config';
import { UserBaseEntity } from './user/user-base.entity';
import { InventoryEntity } from './inventory/inventory.entity';
import { CreateUserTable1782066103000 } from './migrations/1782066103000-CreateUserTable';
import { CreateInventoryTable1782066151000 } from './migrations/1782066151000-CreateInventoryTable';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`, `.env.${process.env.NODE_ENV || 'dev'}`],
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
          entities: [User, UserBaseEntity, InventoryEntity],
          synchronize: configService.get<boolean>('db.databaseSynchronize'),
          migrations: [
            CreateUserTable1782066103000,
            CreateInventoryTable1782066151000,
          ],
          migrationsRun: true,
        };
      },
    }),
    UsersModule,
    LoginModule,
  ],
  controllers: [RegisterController],
  providers: [RegisterService, PasswordService],
})
export class AppModule {}
