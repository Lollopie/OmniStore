type AddToast = (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;

export interface BillingDetails {
  plan: 'starter' | 'growth' | 'enterprise' | null;
  manageable: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

const billingUrl = `${import.meta.env.VITE_NESTJS_HOST_URL}/organizations/billing`;

export async function getBilling(controller: AbortController, addToast: AddToast): Promise<BillingDetails | null> {
  try {
    const response = await fetch(billingUrl, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Failed to get billing details');
    return await response.json();
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
    const response = await fetch(`${billingUrl}/portal`, {
      method: 'POST',
      credentials: 'include',
    });
    const data: { url?: string; message?: string } = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.message || 'Could not open billing portal');
    return data.url;
  } catch (err) {
    addToast(err instanceof Error ? err.message : 'Could not open billing portal', 'error', 5000);
    return null;
  }
}
