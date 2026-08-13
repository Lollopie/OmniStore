import { Injectable } from '@nestjs/common';
import { WarehouseDto } from '@shared/dto/warehouse.dto';
import { WarehouseEntity } from './warehouse.entity';
import { TxRepoProvider } from '../rls/db.helper';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { mapRow } from '../utils/helper';
@Injectable()
export class WarehouseService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
    private readonly dataSource: DataSource,
  ) {}
  async createWarehouse(
    warehouseData: WarehouseDto,
    userId: string,
    role: string,
  ): Promise<WarehouseEntity> {
    const orgId = this.clsService.get<string>('orgId');
    const [rawWh]: WarehouseEntity[] = await this.dataSource.query(
      `SELECT * FROM create_warehouse($1, $2, $3, $4)`,
      [orgId, warehouseData.warehouseName, userId, role],
    );
    return mapRow(this.txRepoProvider.getRepo(WarehouseEntity), rawWh);
  }
  findOne(warehouseId: string): Promise<WarehouseEntity | null> {
    const warehouseRepo = this.txRepoProvider.getRepo(WarehouseEntity);
    return warehouseRepo.findOneBy({ warehouseId });
  }
}
