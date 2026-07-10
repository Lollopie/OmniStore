import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class UserWarehouseRoleService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserWarehouseRoleEntity)
    private userWarehouseRoleEntityRepository: Repository<UserWarehouseRoleEntity>,
    private readonly clsService: ClsService,
  ) {}

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
  async remove(id: number): Promise<void> {
    await this.userWarehouseRoleEntityRepository.delete(id);
  }
  async getUserWarehouses(
    userId: string,
  ): Promise<{ id: string; name: string; role: string }[] | null> {
    return await this.userWarehouseRoleEntityRepository
      .createQueryBuilder('user_warehouse_role')
      .innerJoinAndSelect(
        'WarehouseEntity',
        'warehouse',
        'warehouse.warehouse_id = user_warehouse_role.warehouse_id',
      )
      .where('user_warehouse_role.user_id = :userId', { userId })
      .select([
        'warehouse.warehouse_id AS id',
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
