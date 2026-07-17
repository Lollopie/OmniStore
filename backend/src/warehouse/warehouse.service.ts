import { Injectable } from '@nestjs/common';
import { WarehouseDto } from './warehouse.dto';
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
    user_id: string,
    role: string,
  ): Promise<WarehouseEntity> {
    return await this.dataSource.transaction(async (entityManager) => {
      const newWarehouse = entityManager
        .getRepository(WarehouseEntity)
        .create({ name: warehouseData.name });
      await entityManager.getRepository(WarehouseEntity).save(newWarehouse);
      await entityManager.query(
        `SELECT set_config('app.current_warehouse_id', $1, true)`,
        [newWarehouse.warehouse_id],
      );
      await entityManager.query(
        `SELECT set_config('app.current_user_id', $1, true)`,
        [user_id],
      );
      await entityManager.getRepository(UserWarehouseRoleEntity).save({
        user_id: user_id,
        warehouse_id: newWarehouse.warehouse_id,
        role: role,
      });
      return newWarehouse;
    });
  }
  findOne(warehouse_id: string): Promise<WarehouseEntity | null> {
    return this.warehouseEntityRepository.findOneBy({ warehouse_id });
  }
}
