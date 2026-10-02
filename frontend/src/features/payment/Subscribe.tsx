import { useEffect, useState } from 'react';
import PricingCard from '../homepage/components/Pricing Card.tsx';
import Button from '../../components/Button.tsx';
import { useToast } from '../toast';
import { PRICING_PLANS, type PricingPlan } from '../homepage/pricingPlans.ts';
import { clearCheckoutPending, markCheckoutPending } from './subscriptionContext';

const Subscribe = () => {
  const { addToast } = useToast();
  const [pendingPlan, setPendingPlan] = useState<PricingPlan['id'] | null>(null);

  // A cancelled checkout returns here, so there is no webhook to wait for
  useEffect(() => {
    clearCheckoutPending();
  }, []);

  const subscribe = async (plan: PricingPlan['id']) => {
    setPendingPlan(plan);
    try {
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const data: { url?: string; sessionId?: string; message?: string } = await response.json();
      if (!response.ok || !data.url || !data.sessionId) {
        throw new Error(data.message || 'Could not start checkout');
      }
      markCheckoutPending(data.sessionId);
      window.location.assign(data.url);
    } catch {
      addToast('Could not start checkout. Please try again.', 'error', 5000);
      setPendingPlan(null);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl text-center text-base-400">
        Choose your subscription
      </h1>
      <p className="text-md text-center text-base-content/80">
        Your organization has been created. Pick a plan to get started.
      </p>
      <section className="flex gap-10 flex-col lg:flex-row justify-between items-center max-w-7xl mx-auto p-8">
        {PRICING_PLANS.map((plan) => (
          <PricingCard key={plan.id}
                       title={plan.title}
                       subTitle={plan.subTitle}
                       price={plan.price}
                       features={plan.features}
                       action={
                         <Button className="mt-5"
                                 disabled={pendingPlan !== null}
                                 onClick={() => subscribe(plan.id)}>
                           {pendingPlan === plan.id ? 'Redirecting...' : `Choose ${plan.title}`}
                         </Button>
                       }
          />
        ))}
      </section>
    </div>
  );
};

export default Subscribe;
