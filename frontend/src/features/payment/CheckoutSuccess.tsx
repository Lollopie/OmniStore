import { useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import Button from '../../components/Button.tsx';
import { markCheckoutPending, useSubscription } from './subscriptionContext';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { subscription, loading, checkAgain } = useSubscription();

  // Child effects run before the provider's, so on the page load after Stripe's
  // redirect the provider already confirms this session on its first request
  useEffect(() => {
    if (sessionId) {
      markCheckoutPending(sessionId);
    }
  }, [sessionId]);

  if (subscription) {
    return <Navigate to="/organizations" replace />;
  }

  return (
    <section className="card bg-base-100 rounded-xl border border-base-300 max-w-xl mx-auto">
      <div className="card-body items-center text-center gap-4">
        {loading ? (
          <>
            <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold" role="status">Processing your purchase...</h1>
            <p className="text-base-content/80">This usually only takes a few seconds.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">This is taking longer than usual</h1>
            <p className="text-base-content/80">
              Your payment went through, and access will be enabled shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={checkAgain}>Check again</Button>
              <Link to="/contact" className="btn btn-ghost">Contact support</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CheckoutSuccess;
