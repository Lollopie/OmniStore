import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { WarehouseEntity } from '../warehouse/warehouse.entity';

@Entity('inventory')
export class InventoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => WarehouseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;
  @RelationId((inventory: InventoryEntity) => inventory.warehouse)
  warehouse_id: string;
  @Column()
  name: string;

  @Column('numeric')
  amount: number;
}
