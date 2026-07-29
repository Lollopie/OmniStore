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
    private readonly clsService: ClsService,
  ) {}

  private async runInRlsContext<T>(
    warehouseId: string,
    callback: (repo: Repository<InventoryEntity>) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (entityManager) => {
      await entityManager.query(
        `SELECT set_config('app.current_warehouse_id', $1, true)`,
        [warehouseId],
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
    const warehouseId: string = this.clsService.get('warehouseId');

    let order: Record<string, 'ASC' | 'DESC'> = { itemId: 'DESC' };

    switch (sort as InventorySortOption) {
      case InventorySortOption.OLD:
        order = { itemId: 'ASC' };
        break;
      case InventorySortOption.NAME_ASC:
        order = { itemName: 'ASC', itemId: 'DESC' };
        break;
      case InventorySortOption.NAME_DESC:
        order = { itemName: 'DESC', itemId: 'DESC' };
        break;
      case InventorySortOption.AMOUNT_ASC:
        order = { amount: 'ASC', itemName: 'ASC' };
        break;
      case InventorySortOption.AMOUNT_DESC:
        order = { amount: 'DESC', itemName: 'ASC' };
        break;
      case InventorySortOption.NEW:
      default:
        order = { itemId: 'DESC' };
        break;
    }
    return this.runInRlsContext(warehouseId, (repo) => {
      const options: FindManyOptions<InventoryEntity> = {
        select: {
          itemId: true,
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
    const warehouseId: string = this.clsService.get('warehouseId');
    const newItem = {
      itemName: item.itemName,
      amount: parseInt(item.amount, 10),
      warehouse: { warehouseId: warehouseId },
    };
    return this.runInRlsContext(warehouseId, async (repo) => {
      const newItemPlusUUID = repo.create(newItem);
      return await repo.save(newItemPlusUUID);
    });
  }
  async updateItem(item: InventoryDto): Promise<InventoryEntity> {
    const warehouseId: string = this.clsService.get('warehouseId');
    const updatedItem = {
      itemName: item.itemName,
      amount: parseInt(item.amount, 10),
      warehouse: { warehouseId: warehouseId },
    };
    return this.runInRlsContext(warehouseId, async (repo) => {
      const itemToUpdate = await repo.findOne({
        where: { itemId: item.itemId },
      });
      if (!itemToUpdate) {
        throw new BadRequestException('Item not found');
      }
      const newItem = repo.merge(itemToUpdate, updatedItem);
      return await repo.save(newItem);
    });
  }
  async remove(item: InventoryDto): Promise<DeleteResult> {
    const warehouseId: string = this.clsService.get('warehouseId');
    return await this.runInRlsContext(warehouseId, async (repo) => {
      return await repo.delete({ itemId: item.itemId });
    });
  }
}
