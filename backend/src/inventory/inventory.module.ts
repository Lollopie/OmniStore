import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from './inventory.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { UsersModule } from '../user/users.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { UserWarehouseRoleModule } from '../userWarehouseRole/userWarehouseRole.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryEntity]),
    UsersModule,
    WarehouseModule,
    UserWarehouseRoleModule,
  ],
  providers: [InventoryService],
  controllers: [InventoryController],
})
export class InventoryModule {}
