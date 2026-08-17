import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { UsersModule } from '../user/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordService } from '../auth/password.service';
import { UserWarehouseRoleModule } from '../userWarehouseRole/userWarehouseRole.module';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';
import { TxRepoProvider } from '../rls/db.helper';
import { CookieService } from '../auth/cookie.service';
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
  providers: [
    LoginService,
    PasswordService,
    UserOrganizationRoleService,
    TxRepoProvider,
    CookieService
  ],
  controllers: [LoginController],
})
export class LoginModule {}
