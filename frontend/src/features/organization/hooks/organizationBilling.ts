import { api, errorMessage } from '../../../api/client.ts';

type AddToast = (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;

export interface BillingDetails {
  plan: 'starter' | 'growth' | 'enterprise' | null;
  manageable: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

export async function getBilling(controller: AbortController, addToast: AddToast): Promise<BillingDetails | null> {
  try {
    const { data } = await api.get<BillingDetails>('/organizations/billing', { signal: controller.signal });
    return data;
  } catch (err) {
    if (!controller.signal.aborted) {
      addToast('Failed to get billing details', 'error', 3000);
    }
    if (err instanceof Error) console.error(err.message);
    return null;
  }
}

/** Returns the Stripe Customer Portal URL to redirect to. */
export async function createBillingPortalSession(addToast: AddToast): Promise<string | null> {
  try {
    const { data } = await api.post<{ url?: string }>('/organizations/billing/portal');
    if (!data.url) throw new Error('Could not open billing portal');
    return data.url;
  } catch (err) {
    addToast(errorMessage(err) ?? 'Could not open billing portal', 'error', 5000);
    return null;
  }
}
