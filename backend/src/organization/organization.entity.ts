import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('organization')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'org_id' })
  orgId: string;
  @Column()
  name: string;
  @Column({ name: 'created_at' })
  createdAt: Date;
}
