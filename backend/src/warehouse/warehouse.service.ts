import { Injectable } from '@nestjs/common';
import { WarehouseDto } from '@shared/dto/warehouse.dto';
import { WarehouseEntity } from './warehouse.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserWarehouseRoleEntity } from '../userWarehouseRole/userWarehouseRole.entity';
@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private warehouseEntityRepository: Repository<WarehouseEntity>,
    @InjectRepository(UserWarehouseRoleEntity)
    private userWarehouseRoleRepository: Repository<UserWarehouseRoleEntity>,
    private readonly dataSource: DataSource,
  ) {}
  async createWarehouse(
    warehouseData: WarehouseDto,
    userId: string,
    role: string,
  ): Promise<WarehouseEntity> {
    return await this.dataSource.transaction(async (entityManager) => {
      const newWarehouse = entityManager
        .getRepository(WarehouseEntity)
        .create({ name: warehouseData.warehouseName });
      await entityManager.getRepository(WarehouseEntity).save(newWarehouse);
      await entityManager.query(
        `SELECT set_config('app.current_warehouse_id', $1, true)`,
        [newWarehouse.warehouseId],
      );
      await entityManager.query(
        `SELECT set_config('app.current_user_id', $1, true)`,
        [userId],
      );
      await entityManager.getRepository(UserWarehouseRoleEntity).save({
        userId: userId,
        warehouseId: newWarehouse.warehouseId,
        role: role,
      });
      return newWarehouse;
    });
  }
  findOne(warehouseId: string): Promise<WarehouseEntity | null> {
    return this.warehouseEntityRepository.findOneBy({ warehouseId });
  }
}
