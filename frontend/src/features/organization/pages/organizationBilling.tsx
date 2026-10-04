import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Button from '../../../components/Button.tsx';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import { useToast } from '../../toast';
import { PRICING_PLANS } from '../../homepage/pricingPlans.ts';
import { type BillingDetails, createBillingPortalSession, getBilling } from '../hooks/organizationBilling.ts';

const formatDate = (date: string) => new Date(date).toLocaleDateString();

export function OrganizationBilling() {
  const { addToast } = useToast();
  const isOwner = readStoredValue<string>('orgRole') === 'owner';
  const [billing, setBilling] = useState<BillingDetails | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getBilling(controller, addToast).then((data) => {
      if (!controller.signal.aborted) setBilling(data);
    });
    return () => controller.abort();
  }, [addToast]);

  const openPortal = async () => {
    setIsRedirecting(true);
    const url = await createBillingPortalSession(addToast);
    if (url) {
      window.location.assign(url);
    } else {
      setIsRedirecting(false);
    }
  };

  const plan = PRICING_PLANS.find((p) => p.id === billing?.plan);

  return (
    <div className="card bg-base-100 p-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Billing</h1>
      {billing && (
        <section className="card border border-primary/30 bg-primary/5">
          <div className="card-body gap-3">
            {plan ? (
              <>
                <h3 className="card-title text-primary">
                  {plan.title} plan
                  {billing.status && <span className="badge badge-outline">{billing.status}</span>}
                </h3>
                <p className="text-sm text-base-content/80">${plan.price} per month · {plan.subTitle}</p>
                {billing.cancelAt ? (
                  <p className="text-sm text-warning">Your subscription ends on {formatDate(billing.cancelAt)}.</p>
                ) : (
                  billing.currentPeriodEnd && (
                    <p className="text-sm text-base-content/80">Renews on {formatDate(billing.currentPeriodEnd)}.</p>
                  )
                )}
                {!billing.manageable && (
                  <p className="text-sm text-base-content/80">This plan is not billed through Stripe.</p>
                )}
                <div className="card-actions justify-end">
                  {billing.manageable && isOwner && (
                    <Button onClick={openPortal} disabled={isRedirecting}>
                      {isRedirecting ? 'Redirecting...' : 'Manage billing'}
                    </Button>
                  )}
                  {billing.manageable && !isOwner && (
                    <p className="text-sm text-base-content/60">Only owners can manage billing.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="card-title">No active subscription</h3>
                <p className="text-sm text-base-content/80">
                  Your organization is read-only until it subscribes to a plan.
                </p>
                {isOwner && (
                  <div className="card-actions justify-end">
                    <Link to="/subscribe" className="btn btn-primary">Choose a plan</Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
