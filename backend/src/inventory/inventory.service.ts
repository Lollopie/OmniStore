import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryEntity } from './inventory.entity';
import {
  DataSource,
  DeleteResult,
  FindManyOptions,
  ILike,
  Repository,
} from 'typeorm';
import { InventoryDto } from '@shared/dto/inventory.dto';
import { WarehouseService } from '../warehouse/warehouse.service';
import { ClsService } from 'nestjs-cls';
export enum InventorySortOption {
  NEW = 'new',
  OLD = 'old',
  NAME_ASC = 'itemName asc',
  NAME_DESC = 'itemName desc',
  AMOUNT_ASC = 'amount asc',
  AMOUNT_DESC = 'amount desc',
}
@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly warehouseService: WarehouseService,
    private readonly clsService: ClsService,
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

  async getInventory(
    searchTerm: string,
    page: number,
    sort: string,
  ): Promise<[InventoryEntity[], number]> {
    const itemsPerPage = 10;
    const warehouse_id: string = this.clsService.get('warehouseId');

    let order: Record<string, 'ASC' | 'DESC'> = { id: 'DESC' };

    switch (sort as InventorySortOption) {
      case InventorySortOption.OLD:
        order = { id: 'ASC' };
        break;
      case InventorySortOption.NAME_ASC:
        order = { itemName: 'ASC', id: 'DESC' };
        break;
      case InventorySortOption.NAME_DESC:
        order = { itemName: 'DESC', id: 'DESC' };
        break;
      case InventorySortOption.AMOUNT_ASC:
        order = { amount: 'ASC', itemName: 'ASC' };
        break;
      case InventorySortOption.AMOUNT_DESC:
        order = { amount: 'DESC', itemName: 'ASC' };
        break;
      case InventorySortOption.NEW:
      default:
        order = { id: 'DESC' };
        break;
    }
    return this.runInRlsContext(warehouse_id, (repo) => {
      const options: FindManyOptions<InventoryEntity> = {
        select: {
          id: true,
          itemName: true,
          amount: true,
        },
        order: order,
        take: itemsPerPage,
        skip: (page - 1) * itemsPerPage,
      };
      const trimmedSearchTerm = searchTerm?.trim();
      if (trimmedSearchTerm) {
        options.where = {
          itemName: ILike(`%${trimmedSearchTerm}%`),
        };
      }
      return repo.findAndCount(options);
    });
  }
  async createItem(item: InventoryDto): Promise<InventoryEntity> {
    const warehouse_id: string = this.clsService.get('warehouseId');
    const newItem = {
      itemName: item.itemName,
      amount: parseInt(item.amount, 10),
      warehouse: { warehouse_id: warehouse_id },
    };
    return this.runInRlsContext(warehouse_id, async (repo) => {
      const newItemPlusUUID = repo.create(newItem);
      return await repo.save(newItemPlusUUID);
    });
  }
  async updateItem(item: InventoryDto): Promise<InventoryEntity> {
    const warehouse_id: string = this.clsService.get('warehouseId');
    const updatedItem = {
      itemName: item.itemName,
      amount: parseInt(item.amount, 10),
      warehouse: { warehouse_id: warehouse_id },
    };
    return this.runInRlsContext(warehouse_id, async (repo) => {
      const itemToUpdate = await repo.findOne({ where: { id: item.id } });
      if (!itemToUpdate) {
        throw new BadRequestException('Item not found');
      }
      const newItem = repo.merge(itemToUpdate, updatedItem);
      return await repo.save(newItem);
    });
  }
  async remove(item: InventoryDto): Promise<DeleteResult> {
    const warehouse_id: string = this.clsService.get('warehouseId');
    return await this.runInRlsContext(warehouse_id, async (repo) => {
      return await repo.delete({ id: item.id });
    });
  }
}
