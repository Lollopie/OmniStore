import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryEntity } from './inventory.entity';
import { DeleteResult, FindManyOptions, ILike } from 'typeorm';
import { InventoryDto } from '@shared/dto/inventory.dto';
import { ClsService } from 'nestjs-cls';
import { TxRepoProvider } from '../rls/db.helper';
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
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
  ) {}

  async getInventory(
    searchTerm: string,
    page: number,
    sort: string,
  ): Promise<[InventoryEntity[], number]> {
    const repo = this.txRepoProvider.getRepo(InventoryEntity);
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
    const options: FindManyOptions<InventoryEntity> = {
      select: {
        itemId: true,
        itemName: true,
        amount: true,
      },
      where: {
        warehouseId: warehouseId,
      },
      order: order,
      take: itemsPerPage,
      skip: (page - 1) * itemsPerPage,
    };
    const trimmedSearchTerm = searchTerm?.trim();
    if (trimmedSearchTerm) {
      options.where = {
        warehouseId: warehouseId,
        itemName: ILike(`%${trimmedSearchTerm}%`),
      };
    }
    return repo.findAndCount(options);
  }
  async createItem(item: InventoryDto): Promise<InventoryEntity> {
    const repo = this.txRepoProvider.getRepo(InventoryEntity);
    const warehouseId: string = this.clsService.get('warehouseId');
    const newItem = {
      itemName: item.itemName,
      amount: parseInt(item.amount, 10),
      warehouse: { warehouseId: warehouseId },
    };
    const newItemPlusUUID = repo.create(newItem);
    return await repo.save(newItemPlusUUID);
  }
  async updateItem(item: InventoryDto): Promise<InventoryEntity> {
    const warehouseId: string = this.clsService.get('warehouseId');
    const updatedItem = {
      itemName: item.itemName,
      amount: parseInt(item.amount, 10),
      warehouse: { warehouseId: warehouseId },
    };
    const repo = this.txRepoProvider.getRepo(InventoryEntity);
    const itemToUpdate = await repo.findOne({
      where: { itemId: item.itemId, warehouseId: warehouseId },
    });
    if (!itemToUpdate) {
      throw new NotFoundException('Item not found');
    }
    return await repo.save(repo.merge(itemToUpdate, updatedItem));
  }
  async remove(item: InventoryDto): Promise<DeleteResult> {
    const warehouseId: string = this.clsService.get('warehouseId');
    const repo = this.txRepoProvider.getRepo(InventoryEntity);
    const itemToDelete = await repo.findOne({
      where: { itemId: item.itemId, warehouseId: warehouseId },
    });
    if (!itemToDelete) {
      throw new NotFoundException('Item not found');
    }
    return await repo.delete({ itemId: item.itemId, warehouseId: warehouseId });
  }
}
