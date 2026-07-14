import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { UserWarehouseRoleService } from './userWarehouseRole.service';
import { UsersModule } from '../user/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserWarehouseRoleEntity]), UsersModule],
  providers: [UserWarehouseRoleService],
  exports: [TypeOrmModule, UserWarehouseRoleService],
})
export class UserWarehouseRoleModule {}
