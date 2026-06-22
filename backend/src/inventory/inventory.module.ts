import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from './inventory.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { UsersModule } from '../user/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryEntity]), UsersModule],
  providers: [InventoryService],
  controllers: [InventoryController],
})
export class InventoryModule {}
