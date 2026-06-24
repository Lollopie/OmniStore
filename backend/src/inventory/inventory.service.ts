import { Injectable } from '@nestjs/common';
import { InventoryEntity } from './inventory.entity';
import { DataSource, Repository } from 'typeorm';
import { InventoryDto } from './inventory.dto';
import { UserToken } from '../user/user.decorator';
import { UsersService } from '../user/users.service';

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
  async getInventory(userToken: UserToken): Promise<InventoryEntity[]> {
    return this.runInRlsContext(userToken.user_id, (repo) => {
      return repo.find({
        select: {
          name: true,
          amount: true,
        },
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
