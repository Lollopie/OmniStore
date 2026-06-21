import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserBaseEntity } from '../user/user-base.entity';

@Entity('inventory')
export class InventoryEntity extends UserBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('numeric')
  amount: number;
}
