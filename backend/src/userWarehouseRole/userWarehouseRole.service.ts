import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { ClsService } from 'nestjs-cls';
import { UsersService } from '../user/users.service';

@Injectable()
export class UserWarehouseRoleService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserWarehouseRoleEntity)
    private userWarehouseRoleEntityRepository: Repository<UserWarehouseRoleEntity>,
    private readonly clsService: ClsService,
    private readonly usersService: UsersService,
  ) {}

  private getActiveWarehouseId(): string {
    const warehouseId = this.clsService.get<string>('warehouseId');
    if (!warehouseId) {
      throw new BadRequestException('No active Warehouse found');
    }
    return warehouseId;
  }
  private async runInRlsContext<T>(
    id: string[],
    policy: string[],
    callback: (repo: Repository<UserWarehouseRoleEntity>) => Promise<T>,
  ): Promise<T> {
    if (id.length === 0 || policy.length === 0 || id.length !== policy.length) {
      throw new BadRequestException('Invalid parameters for RLS context');
    }
    return this.dataSource.transaction(async (entityManager) => {
      for (let i = 0; i < policy.length; i++) {
        await entityManager.query(
          `SELECT set_config('app.current_` + policy[i] + `_id', $1, true)`,
          [id[i]],
        );
      }
      const transactionalRepo = entityManager.getRepository(
        UserWarehouseRoleEntity,
      );

      return callback(transactionalRepo);
    });
  }
  findByUserId(user_id: string): Promise<UserWarehouseRoleEntity | null> {
    return this.runInRlsContext([user_id], ['user'], (repo) =>
      repo.findOneBy({
        user_id: user_id,
      }),
    );
  }
  findRole(
    user_id: string,
    warehouse_id: string,
  ): Promise<UserWarehouseRoleEntity | null> {
    return this.runInRlsContext(
      [user_id, warehouse_id],
      ['user', 'warehouse'],
      (repo) =>
        repo.findOneBy({
          user_id: user_id,
          warehouse_id: warehouse_id,
        }),
    );
  }

  async addUserToWarehouse(
    username: string,
    role: string,
  ): Promise<UserWarehouseRoleEntity> {
    const warehouseId = this.getActiveWarehouseId();
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingRole = await this.findRole(user.user_id, warehouseId);
    if (existingRole) {
      throw new ConflictException('User already belongs to this warehouse');
    }

    return await this.runInRlsContext(
      [user.user_id, warehouseId],
      ['user', 'warehouse'],
      (repo) =>
        repo.save({
          user_id: user.user_id,
          warehouse_id: warehouseId,
          role,
        }),
    );
  }

  async updateUserRole(
    username: string,
    role: string,
  ): Promise<UserWarehouseRoleEntity> {
    const warehouseId = this.getActiveWarehouseId();
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const existingRole = await this.findRole(user.user_id, warehouseId);

    if (!existingRole) {
      throw new NotFoundException('User is not assigned to this warehouse');
    }

    existingRole.role = role;
    return await this.runInRlsContext(
      [warehouseId, user.user_id],
      ['warehouse', 'user'],
      (repo) => repo.save(existingRole),
    );
  }

  async getUserWarehouses(
    userId: string,
  ): Promise<{ warehouse_id: string; name: string; role: string }[] | null> {
    return await this.runInRlsContext([userId], ['user'], (repo) =>
      repo
        .createQueryBuilder('user_warehouse_role')
        .innerJoinAndSelect(
          'WarehouseEntity',
          'warehouse',
          'warehouse.warehouse_id = user_warehouse_role.warehouse_id',
        )
        .where('user_warehouse_role.user_id = :userId', { userId })
        .select([
          'warehouse.warehouse_id AS warehouse_id',
          'warehouse.name AS name',
          'user_warehouse_role.role AS role',
        ])
        .getRawMany(),
    );
  }
  async getUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: { user_id: string; username: string; role: string }[];
    total: number;
  }> {
    const warehouse_id: string = this.clsService.get('warehouseId');
    const skip = (page - 1) * limit;

    return await this.runInRlsContext(
      [warehouse_id],
      ['warehouse'],
      async (repo) => {
        const queryBuilder = repo
          .createQueryBuilder('user_warehouse_role')
          .innerJoin(
            'UserEntity',
            'user',
            'user.user_id = user_warehouse_role.user_id',
          )
          .where('user_warehouse_role.warehouse_id = :warehouse_id', {
            warehouse_id,
          });
        const total = await queryBuilder.getCount();
        const rawResults: {
          user_id: string;
          username: string;
          role: string;
        }[] = await queryBuilder
          .select([
            'user.user_id AS user_id',
            'user.username AS username',
            'user_warehouse_role.role AS role',
          ])
          .offset(skip)
          .limit(limit)
          .getRawMany();

        return {
          data: rawResults,
          total,
        };
      },
    );
  }
}
