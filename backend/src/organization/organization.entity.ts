import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export const SUBSCRIPTION_PLANS = ['starter', 'growth', 'enterprise'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

@Entity('organization')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'org_id' })
  orgId: string;
  @Column()
  name: string;
  @Column({ name: 'created_at' })
  createdAt: Date;
  @Column({ type: 'text', nullable: true, default: null })
  subscription: SubscriptionPlan | null;
  @Column({
    name: 'stripe_subscription_id',
    type: 'text',
    nullable: true,
    default: null,
  })
  stripeSubscriptionId: string | null;
}
