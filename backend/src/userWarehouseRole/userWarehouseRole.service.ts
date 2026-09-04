import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { ClsService } from 'nestjs-cls';
import { UsersService } from '../user/users.service';
import { TxRepoProvider } from '../rls/db.helper';
import { UserOrganizationRoleEntity } from '../userOrganizationRole/userOrganizationRole.entity';

@Injectable()
export class UserWarehouseRoleService {
  constructor(
    private readonly clsService: ClsService,
    private readonly txRepoProvider: TxRepoProvider,
    private readonly usersService: UsersService,
  ) {}

  private getActiveWarehouseId(): string {
    const warehouseId = this.clsService.get<string>('warehouseId');
    if (!warehouseId) {
      throw new BadRequestException('No active Warehouse found');
    }
    return warehouseId;
  }
  findRole(
    userId: string,
    warehouseId: string,
  ): Promise<UserWarehouseRoleEntity | null> {
    const repo = this.txRepoProvider.getRepo(UserWarehouseRoleEntity);
    return repo.findOneBy({
      userId: userId,
      warehouseId: warehouseId,
    });
  }

  async addUserToWarehouse(
    username: string,
    role: string,
  ): Promise<UserWarehouseRoleEntity> {
    const repo = this.txRepoProvider.getRepo(UserWarehouseRoleEntity);
    const userOrgRepo = this.txRepoProvider.getRepo(UserOrganizationRoleEntity);
    const warehouseId = this.getActiveWarehouseId();
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userOrganizationId = await userOrgRepo.findOneBy({
      userId: user.userId,
      orgId: this.clsService.get('orgId'),
    });
    if (!userOrganizationId) {
      throw new BadRequestException(
        'User does not belong to the same organization',
      );
    }
    const existingRole = await this.findRole(user.userId, warehouseId);
    if (existingRole) {
      throw new ConflictException('User already belongs to this warehouse');
    }
    return await repo.save({
      userId: user.userId,
      warehouseId: warehouseId,
      role,
    });
  }

  async updateUserRole(
    username: string,
    role: string,
  ): Promise<UserWarehouseRoleEntity> {
    const repo = this.txRepoProvider.getRepo(UserWarehouseRoleEntity);
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
    return await repo.save(existingRole);
  }

  async getUserWarehouses(
    userId: string,
  ): Promise<{ warehouseId: string; name: string; role: string }[] | null> {
    const repo = this.txRepoProvider.getRepo(UserWarehouseRoleEntity);
    return repo
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
      .getRawMany();
  }
  async getUsers(
    page: number = 1,
    limit: number = 10,
    searchTerm: string,
  ): Promise<{
    data: { userId: string; username: string; role: string }[];
    total: number;
  }> {
    const repo = this.txRepoProvider.getRepo(UserWarehouseRoleEntity);
    const warehouseId: string = this.clsService.get('warehouseId');
    const skip = (page - 1) * limit;
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
  }
}
