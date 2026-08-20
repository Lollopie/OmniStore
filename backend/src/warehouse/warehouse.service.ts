import { Injectable } from '@nestjs/common';
import { WarehouseDto } from '@shared/dto/warehouse.dto';
import { WarehouseEntity } from './warehouse.entity';
import { TxRepoProvider } from '../rls/db.helper';
import { ClsService } from 'nestjs-cls';
import { UserWarehouseRoleEntity } from '../userWarehouseRole/userWarehouseRole.entity';
@Injectable()
export class WarehouseService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
  ) {}
  async createWarehouse(
    warehouseData: WarehouseDto,
    userId: string,
    role: string,
  ): Promise<WarehouseEntity> {
    const orgId = this.clsService.get<string>('orgId');
    const repo = this.txRepoProvider.getRepo(WarehouseEntity);
    const userWarehouseRoleRepo = this.txRepoProvider.getRepo(
      UserWarehouseRoleEntity,
    );
    const warehouse = repo.create({
      name: warehouseData.warehouseName,
      orgId,
    });
    const savedWarehouse = await repo.save(warehouse);
    const userWarehouseRole = userWarehouseRoleRepo.create({
      userId,
      warehouseId: savedWarehouse.warehouseId,
      role,
    });
    await userWarehouseRoleRepo.save(userWarehouseRole);
    return savedWarehouse;
  }
  findOne(warehouseId: string): Promise<WarehouseEntity | null> {
    const warehouseRepo = this.txRepoProvider.getRepo(WarehouseEntity);
    return warehouseRepo.findOneBy({ warehouseId });
  }
}
