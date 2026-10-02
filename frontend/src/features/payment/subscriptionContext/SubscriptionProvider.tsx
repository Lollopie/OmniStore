import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SubscriptionContext, type SubscriptionContextType } from './useSubscription.ts';
import { useAuth } from '../../auth/authContext';
import { clearCheckoutPending, getPendingCheckoutSessionId } from './checkoutPending.ts';

type Subscription = SubscriptionContextType['subscription'];

// The backend confirms the session with Stripe directly, but the subscription can
// take a moment to become active, so retry for up to ~30s before giving up
const CHECKOUT_POLL_INTERVAL_MS = 2000;
const CHECKOUT_POLL_ATTEMPTS = 15;

const fetchSubscription = async (sessionId: string | null): Promise<Subscription> => {
  try {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/organizations/subscription${query}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data: { subscription?: Subscription } = await response.json();
    return response.ok ? data.subscription ?? null : null;
  } catch {
    return null;
  }
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<{ subscription: Subscription; loaded: boolean }>({
    subscription: null,
    loaded: false,
  });
  // Bumped by checkAgain to rerun the confirmation
  const [attempt, setAttempt] = useState(0);
  // Kept after giving up, so "Check again" can still confirm the session
  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async (poll: number) => {
      const sessionId = getPendingCheckoutSessionId() ?? lastSessionIdRef.current;
      lastSessionIdRef.current = sessionId;
      const subscription = await fetchSubscription(sessionId);
      if (cancelled) {
        return;
      }
      if (!subscription && sessionId && poll < CHECKOUT_POLL_ATTEMPTS) {
        timer = setTimeout(() => load(poll + 1), CHECKOUT_POLL_INTERVAL_MS);
        return;
      }
      // Either confirmed or given up: stop polling on future page loads
      clearCheckoutPending();
      if (subscription) {
        lastSessionIdRef.current = null;
      }
      setState({ subscription, loaded: true });
    };
    load(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthenticated, attempt]);

  const checkAgain = useCallback(() => {
    setState((prev) => ({ ...prev, loaded: false }));
    setAttempt((prev) => prev + 1);
  }, []);

  const subscription = isAuthenticated ? state.subscription : null;
  const loading = isAuthenticated && !state.loaded;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isReadOnly: isAuthenticated && !loading && subscription === null,
        checkAgain,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
