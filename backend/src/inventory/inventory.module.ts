import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from './inventory.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { UsersModule } from '../user/users.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { UserWarehouseRoleModule } from '../userWarehouseRole/userWarehouseRole.module';
import { TxRepoProvider } from '../rls/db.helper';
import { GuardDBService } from '../utils/guardDB.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryEntity]),
    UsersModule,
    WarehouseModule,
    UserWarehouseRoleModule,
  ],
  providers: [InventoryService, TxRepoProvider, GuardDBService],
  controllers: [InventoryController],
})
export class InventoryModule {}
