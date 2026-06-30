import { Injectable } from '@nestjs/common';
import { InventoryEntity } from './inventory.entity';
import { DataSource, Repository } from 'typeorm';
import { InventoryDto } from './inventory.dto';
import { UserToken } from '../user/user.decorator';
import { UsersService } from '../user/users.service';
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
    private readonly userService: UsersService,
  ) {}

  private async runInRlsContext<T>(
    userId: string,
    callback: (repo: Repository<InventoryEntity>) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (entityManager) => {
      await entityManager.query(
        `SELECT set_config('app.current_user_id', $1, true)`,
        [userId],
      );

      const transactionalRepo = entityManager.getRepository(InventoryEntity);

      return callback(transactionalRepo);
    });
  }

  async findAll(userToken: UserToken): Promise<InventoryEntity[]> {
    return this.runInRlsContext(userToken.user_id, (repo) => {
      return repo.find();
    });
  }

  async getInventory(
    userToken: UserToken,
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
    return this.runInRlsContext(userToken.user_id, (repo) => {
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
    userToken: UserToken,
  ): Promise<InventoryEntity> {
    if (!(await this.userService.findOne(userToken.user_id))) {
      throw new Error('User not found');
    }
    const newItem = {
      name: item.name,
      amount: parseInt(item.amount, 10),
      user_id: userToken.user_id,
    };
    return this.runInRlsContext(userToken.user_id, async (repo) => {
      const newItemPlusUUID = repo.create(newItem);
      return await repo.save(newItemPlusUUID);
    });
  }

  async remove(id: number, userToken: UserToken): Promise<void> {
    await this.runInRlsContext(userToken.user_id, async (repo) => {
      await repo.delete(id);
    });
  }
}
