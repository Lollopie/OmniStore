import { createContext, useContext } from 'react';
import type { PricingPlan } from '../../homepage/pricingPlans.ts';

export interface SubscriptionContextType {
  subscription: PricingPlan['id'] | null;
  loading: boolean;
  isReadOnly: boolean;
  checkAgain: () => void;
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
