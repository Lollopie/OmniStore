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
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  itemId: string;
  @ManyToOne(() => WarehouseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;
  @RelationId((inventory: InventoryEntity) => inventory.warehouse)
  warehouseId: string;
  @Column({ name: 'item_name' })
  itemName: string;

  @Column('numeric')
  amount: number;
}
