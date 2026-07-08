import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserWarehouseRoleEntity } from './userWarehouseRole.entity';

@Injectable()
export class UserWarehouseRoleService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserWarehouseRoleEntity)
    private userWarehouseRoleEntityRepository: Repository<UserWarehouseRoleEntity>,
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
}
