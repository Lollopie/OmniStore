import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { UserWarehouseRoleService } from './userWarehouseRole.service';
import { UsersModule } from '../user/users.module';
import { TxRepoProvider } from '../rls/db.helper';

@Module({
  imports: [TypeOrmModule.forFeature([UserWarehouseRoleEntity]), UsersModule],
  providers: [UserWarehouseRoleService, TxRepoProvider],
  exports: [TypeOrmModule, UserWarehouseRoleService],
})
export class UserWarehouseRoleModule {}
