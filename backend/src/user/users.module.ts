import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './user.entity';
import { TxRepoProvider } from '../rls/txrepo.service';
import { AuthService } from '../auth/auth.service';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';
import { GuardDBService } from '../utils/guardDB.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [
    UsersService,
    AuthService,
    TxRepoProvider,
    UserOrganizationRoleService,
    GuardDBService,
  ],
  controllers: [UsersController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
