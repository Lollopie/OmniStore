import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Button from '../../../components/Button.tsx';
import { PageCard, SectionCard } from '../../../components/PageCard.tsx';
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
    <PageCard title="Billing" description="Your organization's subscription plan and payment details.">
      {billing && (plan ? (
        <SectionCard
          title={<>
            {plan.title} plan
            {billing.status && <span className="badge badge-outline">{billing.status}</span>}
          </>}
          description={`$${plan.price} per month · ${plan.subTitle}`}
          actions={billing.manageable && (isOwner ? (
            <Button onClick={openPortal} disabled={isRedirecting}>
              {isRedirecting ? 'Redirecting...' : 'Manage billing'}
            </Button>
          ) : (
            <p className="text-sm text-base-content/60">Only owners can manage billing.</p>
          ))}
        >
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
        </SectionCard>
      ) : (
        <SectionCard
          tone="neutral"
          title="No active subscription"
          description="Your organization is read-only until it subscribes to a plan."
          actions={isOwner && <Link to="/subscribe" className="btn btn-primary">Choose a plan</Link>}
        />
      ))}
    </PageCard>
  );
}
