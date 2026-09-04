import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WarehouseEntity } from '../warehouse/warehouse.entity';

@Entity('inventory')
export class InventoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  itemId: string;
  @ManyToOne(() => WarehouseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;
  @Column('uuid', { name: 'warehouse_id' })
  warehouseId: string;
  @Column({ name: 'item_name' })
  itemName: string;

  @Column('numeric')
  amount: number;
}
