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

  findAll(): Promise<UserWarehouseRoleEntity[]> {
    return this.userWarehouseRoleEntityRepository.find();
  }

  findOne(user_id: string): Promise<UserWarehouseRoleEntity | null> {
    return this.userWarehouseRoleEntityRepository.findOneBy({ user_id });
  }
  findByUserId(user_id: string): Promise<UserWarehouseRoleEntity[] | null> {
    return this.userWarehouseRoleEntityRepository.findBy({
      user_id: user_id,
    });
  }
  findRole(
    user_id: string,
    warehouse_id: string,
  ): Promise<UserWarehouseRoleEntity[] | null> {
    return this.userWarehouseRoleEntityRepository.findBy({
      user_id: user_id,
      warehouse_id: warehouse_id,
    });
  }
  async createRole(
    user_id: string,
    warehouse_id: string,
    role: string,
  ): Promise<UserWarehouseRoleEntity> {
    const newRole = this.userWarehouseRoleEntityRepository.create({
      user_id: user_id,
      warehouse_id: warehouse_id,
      role: role,
    });
    return await this.userWarehouseRoleEntityRepository.save(newRole);
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

    const existingRole = await this.userWarehouseRoleEntityRepository.findOneBy(
      {
        user_id: user.user_id,
        warehouse_id: warehouseId,
      },
    );
    if (existingRole) {
      throw new ConflictException('User already belongs to this warehouse');
    }

    return await this.userWarehouseRoleEntityRepository.save({
      user_id: user.user_id,
      warehouse_id: warehouseId,
      role,
    });
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
    const existingRole = await this.userWarehouseRoleEntityRepository.findOneBy(
      {
        user_id: user.user_id,
        warehouse_id: warehouseId,
      },
    );
    if (!existingRole) {
      throw new NotFoundException('User is not assigned to this warehouse');
    }

    existingRole.role = role;
    return await this.userWarehouseRoleEntityRepository.save(existingRole);
  }

  async remove(id: number): Promise<void> {
    await this.userWarehouseRoleEntityRepository.delete(id);
  }
  async getUserWarehouses(
    userId: string,
  ): Promise<{ warehouse_id: string; name: string; role: string }[] | null> {
    return await this.userWarehouseRoleEntityRepository
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
      .getRawMany();
  }
  async getUsers(): Promise<
    { user_id: string; username: string; role: string }[]
  > {
    const warehouse_id: string = this.clsService.get('warehouseId');
    return await this.userWarehouseRoleEntityRepository
      .createQueryBuilder('user_warehouse_role')
      .innerJoinAndSelect(
        'UserEntity',
        'user',
        'user.user_id = user_warehouse_role.user_id',
      )
      .where('user_warehouse_role.warehouse_id = :warehouse_id', {
        warehouse_id,
      })
      .select([
        'user.user_id AS user_id',
        'user.username AS username',
        'user_warehouse_role.role AS role',
      ])
      .getRawMany();
  }
}
