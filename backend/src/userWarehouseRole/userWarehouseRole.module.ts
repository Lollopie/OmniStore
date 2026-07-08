import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { UserWarehouseRoleService } from './userWarehouseRole.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserWarehouseRoleEntity])],
  providers: [UserWarehouseRoleService],
  exports: [TypeOrmModule, UserWarehouseRoleService],
})
export class UserWarehouseRoleModule {}
