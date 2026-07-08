import { Injectable } from '@nestjs/common';
import { InventoryEntity } from './inventory.entity';
import { DataSource, Repository } from 'typeorm';
import { InventoryDto } from './inventory.dto';
import { WarehouseService } from '../warehouse/warehouse.service';
// Define an enum for your sorting options
export enum InventorySortOption {
  NEW = 'new',
  OLD = 'old',
  NAME_ASC = 'name asc',
  NAME_DESC = 'name desc',
  AMOUNT_ASC = 'amount asc',
  AMOUNT_DESC = 'amount desc',
}
@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly warehouseService: WarehouseService,
  ) {}

  private async runInRlsContext<T>(
    warehouse_id: string,
    callback: (repo: Repository<InventoryEntity>) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (entityManager) => {
      await entityManager.query(
        `SELECT set_config('app.current_warehouse_id', $1, true)`,
        [warehouse_id],
      );

      const transactionalRepo = entityManager.getRepository(InventoryEntity);

      return callback(transactionalRepo);
    });
  }

  async findAll(warehouse_id: string): Promise<InventoryEntity[]> {
    return this.runInRlsContext(warehouse_id, (repo) => {
      return repo.find();
    });
  }

  async getInventory(
    warehouse_id: string,
    page: number,
    sort: string,
  ): Promise<[InventoryEntity[], number]> {
    const itemsPerPage = 10;

    // 1. Build the dynamic order object based on the sort string
    let order: Record<string, 'ASC' | 'DESC'> = { id: 'DESC' }; // Default fallback: New

    switch (sort as InventorySortOption) {
      case InventorySortOption.OLD:
        order = { id: 'ASC' };
        break;
      case InventorySortOption.NAME_ASC:
        order = { name: 'ASC', id: 'DESC' }; // Tie-breaker: Newest first if names match
        break;
      case InventorySortOption.NAME_DESC:
        order = { name: 'DESC', id: 'DESC' };
        break;
      case InventorySortOption.AMOUNT_ASC:
        order = { amount: 'ASC', name: 'ASC' }; // Tie-breaker: Alphabetical by name
        break;
      case InventorySortOption.AMOUNT_DESC:
        order = { amount: 'DESC', name: 'ASC' }; // Tie-breaker: Alphabetical by name
        break;
      case InventorySortOption.NEW:
      default:
        order = { id: 'DESC' };
        break;
    }
    return this.runInRlsContext(warehouse_id, (repo) => {
      return repo.findAndCount({
        select: {
          name: true,
          amount: true,
          // created_at: true, // Uncomment if your UI needs the timestamp as well
        },
        order: order, // 2. Pass the order object to TypeORM
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      });
    });
  }
  async createItem(
    item: InventoryDto,
    warehouse_id: string,
  ): Promise<InventoryEntity> {
    if (!(await this.warehouseService.findOne(warehouse_id))) {
      throw new Error('Warehouse not found');
    }
    const newItem = {
      name: item.name,
      amount: parseInt(item.amount, 10),
      warehouse: { warehouse_id: warehouse_id },
    };
    return this.runInRlsContext(warehouse_id, async (repo) => {
      const newItemPlusUUID = repo.create(newItem);
      return await repo.save(newItemPlusUUID);
    });
  }

  async remove(id: number, warehouse_id: string): Promise<void> {
    await this.runInRlsContext(warehouse_id, async (repo) => {
      await repo.delete(id);
    });
  }
}
