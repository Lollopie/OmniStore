import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('warehouse')
export class WarehouseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'warehouse_id' })
  warehouseId: string;
  @Column()
  name: string;
}
