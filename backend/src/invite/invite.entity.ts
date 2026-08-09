import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrganizationEntity } from '../organization/organization.entity';
import { WarehouseEntity } from '../warehouse/warehouse.entity';
@Entity('invite')
export class InviteEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'invite_id' })
  inviteId: string;
  @Column()
  email: string;
  @Column('uuid', { name: 'org_id' })
  orgId: string;
  @Column('uuid', { name: 'warehouse_id' })
  warehouseId: string;
  @Column({ type: 'varchar', length: 50 })
  role: string;
  @Column({ name: 'token_hash' })
  tokenHash: string;
  @Column({ name: 'expires_at' })
  expiresAt: Date;
  @Column()
  consumed: Date;
  @Column({ name: 'created_at' })
  createdAt: Date;
  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  org: OrganizationEntity;
  @ManyToOne(() => WarehouseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;
}
