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
  findRole(
    userId: string,
    warehouseId: string,
  ): Promise<UserWarehouseRoleEntity | null> {
    return this.runInRlsContext(
      [userId, warehouseId],
      ['user', 'warehouse'],
      (repo) =>
        repo.findOneBy({
          userId: userId,
          warehouseId: warehouseId,
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

    const existingRole = await this.findRole(user.userId, warehouseId);
    if (existingRole) {
      throw new ConflictException('User already belongs to this warehouse');
    }

    return await this.runInRlsContext(
      [user.userId, warehouseId],
      ['user', 'warehouse'],
      (repo) =>
        repo.save({
          userId: user.userId,
          warehouseId: warehouseId,
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
    const existingRole = await this.findRole(user.userId, warehouseId);

    if (!existingRole) {
      throw new NotFoundException('User is not assigned to this warehouse');
    }

    existingRole.role = role;
    return await this.runInRlsContext(
      [warehouseId, user.userId],
      ['warehouse', 'user'],
      (repo) => repo.save(existingRole),
    );
  }

  async getUserWarehouses(
    userId: string,
  ): Promise<{ warehouseId: string; name: string; role: string }[] | null> {
    return await this.runInRlsContext([userId], ['user'], (repo) =>
      repo
        .createQueryBuilder('user_warehouse_role')
        .innerJoinAndSelect(
          'WarehouseEntity',
          'warehouse',
          'warehouse.warehouseId = user_warehouse_role.warehouseId',
        )
        .where('user_warehouse_role.userId = :userId', { userId })
        .select([
          'warehouse.warehouseId AS "warehouseId"',
          'warehouse.name AS name',
          'user_warehouse_role.role AS role',
        ])
        .getRawMany(),
    );
  }
  async getUsers(
    page: number = 1,
    limit: number = 10,
    searchTerm: string,
  ): Promise<{
    data: { userId: string; username: string; role: string }[];
    total: number;
  }> {
    const warehouseId: string = this.clsService.get('warehouseId');
    const skip = (page - 1) * limit;

    return await this.runInRlsContext(
      [warehouseId],
      ['warehouse'],
      async (repo) => {
        const queryBuilder = repo
          .createQueryBuilder('user_warehouse_role')
          .innerJoin(
            'UserEntity',
            'user',
            'user.userId = user_warehouse_role.userId',
          )
          .where('user_warehouse_role.warehouseId = :warehouseId', {
            warehouseId,
          });
        const cleanedTerm = searchTerm?.trim();
        if (cleanedTerm) {
          queryBuilder.andWhere('user.username ILIKE :search', {
            search: `%${cleanedTerm}%`,
          });
        }
        const total = await queryBuilder.getCount();
        const rawResults: {
          userId: string;
          username: string;
          role: string;
        }[] = await queryBuilder
          .select([
            'user.userId AS "userId"',
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
