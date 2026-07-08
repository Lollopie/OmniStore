import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { UsersModule } from '../user/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordService } from '../auth/password.service';
import { UserWarehouseRoleModule } from '../userWarehouseRole/userWarehouseRole.module';
@Module({
  imports: [
    UsersModule,
    UserWarehouseRoleModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'), // 3. Dynamically fetch the secret
        signOptions: {
          expiresIn: configService.get<number>('auth.jwtExpiresIn'),
        },
      }),
    }),
  ],
  providers: [LoginService, PasswordService],
  controllers: [LoginController],
})
export class LoginModule {}
