export interface PricingPlan {
  id: 'starter' | 'growth' | 'enterprise';
  title: string;
  subTitle: string;
  price: number;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    title: 'Starter',
    subTitle: 'For small teams getting organized',
    price: 29,
    features: [
      '1 warehouse',
      'Up to 5 users',
      'Role-based access control',
      'Real-time inventory tracking',
      'Email support',
    ],
  },
  {
    id: 'growth',
    title: 'Growth',
    subTitle: 'For multi-warehouse operations',
    price: 99,
    features: [
      'Up to 5 warehouses',
      'Up to 25 users',
      'Everything in Starter',
      'Priority support',
      '',
    ],
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    subTitle: 'For large-scale logistics teams',
    price: 299,
    features: [
      'Unlimited warehouses',
      'Unlimited users',
      'Everything in Growth',
      'Dedicated account manager',
      'SLA guarantee',
    ],
  },
];
