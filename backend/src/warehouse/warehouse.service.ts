import { Injectable } from '@nestjs/common';
import { WarehouseDto } from '@shared/dto/warehouse.dto';
import { WarehouseEntity } from './warehouse.entity';
import { UserWarehouseRoleEntity } from '../userWarehouseRole/userWarehouseRole.entity';
import { TxRepoProvider } from '../rls/db.helper';
@Injectable()
export class WarehouseService {
  constructor(private readonly txRepoProvider: TxRepoProvider) {}
  async createWarehouse(
    warehouseData: WarehouseDto,
    userId: string,
    role: string,
  ): Promise<WarehouseEntity> {
    const warehouseRepo = this.txRepoProvider.getRepo(WarehouseEntity);
    const userWarehouseRoleRepo = this.txRepoProvider.getRepo(
      UserWarehouseRoleEntity,
    );
    const newWarehouse = warehouseRepo.create({
      name: warehouseData.warehouseName,
    });
    await warehouseRepo.save(newWarehouse);
    await userWarehouseRoleRepo.save({
      userId: userId,
      warehouseId: newWarehouse.warehouseId,
      role: role,
    });
    return newWarehouse;
  }
  findOne(warehouseId: string): Promise<WarehouseEntity | null> {
    const warehouseRepo = this.txRepoProvider.getRepo(WarehouseEntity);
    return warehouseRepo.findOneBy({ warehouseId });
  }
}
