import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { WarehouseEntity } from '../warehouse/warehouse.entity';

@Entity('user_warehouse_role')
export class UserWarehouseRoleEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  user_id: string;

  @PrimaryColumn('uuid', { name: 'warehouse_id' })
  warehouse_id: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  // --- Relations ---

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => WarehouseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;
}
