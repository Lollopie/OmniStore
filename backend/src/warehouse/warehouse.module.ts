import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseEntity } from './warehouse.entity';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { UserWarehouseRoleEntity } from '../userWarehouseRole/userWarehouseRole.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserWarehouseRoleModule } from '../userWarehouseRole/userWarehouseRole.module';
import { TxRepoProvider } from '../rls/db.helper';
import { OrganizationModule } from '../organization/organization.module';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';
import { InviteModule } from '../invite/invite.module';
import { GuardDBService } from '../utils/guardDB.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WarehouseEntity]),
    TypeOrmModule.forFeature([UserWarehouseRoleEntity]),
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
    UserWarehouseRoleModule,
    OrganizationModule,
    InviteModule,
  ],
  providers: [
    WarehouseService,
    TxRepoProvider,
    UserOrganizationRoleService,
    GuardDBService,
    AuthService,
    MailService,
  ],
  exports: [TypeOrmModule, WarehouseService],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
