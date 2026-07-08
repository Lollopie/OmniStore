import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('warehouse')
export class WarehouseEntity {
  @PrimaryGeneratedColumn('uuid')
  warehouse_id: string;
  @Column()
  name: string;
}
