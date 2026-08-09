import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from '../organization/organization.entity';
@Entity('warehouse')
export class WarehouseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'warehouse_id' })
  warehouseId: string;
  @Column('uuid', { name: 'org_id' })
  orgId: string;
  @Column()
  name: string;
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  org: OrganizationEntity;
  @Column({ name: 'created_at' })
  createdAt: Date;
}
