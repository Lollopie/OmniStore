import { Link, useLocation } from 'react-router';
import { useSubscription } from './subscriptionContext';

export default function ReadOnlyBanner() {
  const { isReadOnly } = useSubscription();
  const { pathname } = useLocation();
  if (!isReadOnly || pathname === '/subscribe' || pathname === '/checkout/success') {
    return null;
  }
  return (
    <div role="alert" className="alert alert-warning lg:max-w-5xl mx-auto mt-4 flex flex-col sm:flex-row justify-between">
      <span>Your organization has no active subscription. The app is in read-only mode.</span>
      <Link to="/subscribe" className="btn btn-sm">Choose a plan</Link>
    </div>
  );
}
