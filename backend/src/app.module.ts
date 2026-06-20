import { Module } from '@nestjs/common';
import { RegisterController } from './register/register.controller';
import { RegisterService } from './register/register.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { UsersModule } from './user/users.module';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';
import dbConfig from './config/db.config';
import { PasswordService } from './password/password.service';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
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
          entities: [User],
          synchronize: configService.get<boolean>('db.databaseSynchronize'),
        };
      },
    }),
    UsersModule,
  ],
  controllers: [RegisterController, LoginController],
  providers: [RegisterService, LoginService, PasswordService],
})
export class AppModule {}
