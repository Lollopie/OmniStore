// Remembers the Stripe Checkout session the user left for, so the
// SubscriptionProvider can confirm it instead of immediately going read-only.
const CHECKOUT_PENDING_KEY = 'checkoutPending';
// Ignore sessions from abandoned checkouts after this long
const CHECKOUT_PENDING_MAX_AGE_MS = 60 * 60 * 1000;

export const markCheckoutPending = (sessionId: string): void => {
  try {
    sessionStorage.setItem(CHECKOUT_PENDING_KEY, JSON.stringify({ sessionId, at: Date.now() }));
  } catch {
    // Storage unavailable: the provider just won't confirm the session
  }
};

export const getPendingCheckoutSessionId = (): string | null => {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_PENDING_KEY);
    if (!raw) {
      return null;
    }
    const { sessionId, at } = JSON.parse(raw) as { sessionId?: string; at?: number };
    if (!sessionId || !at || Date.now() - at > CHECKOUT_PENDING_MAX_AGE_MS) {
      sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
      return null;
    }
    return sessionId;
  } catch {
    return null;
  }
};

export const clearCheckoutPending = (): void => {
  try {
    sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
  } catch {
    // ignore
  }
};
