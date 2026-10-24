import { useLocation } from 'react-router';
import AuthForm from '../auth/authForm/AuthForm.tsx';

const InviteManager = () => {
  // The router's path is also the API endpoint (/invites/accept). window.location.pathname would
  // include the /omnistore prefix the app may be served under.
  const { pathname, search } = useLocation();
  return (
    <AuthForm
      title="Create an Account"
      buttonText="Register"
      endpoint={pathname + "?token=" + new URLSearchParams(search).get("token")}
      successMessage="Registration successful! You can now log in."
      onSuccess={() => {}}
      handleResponse={() => {}}
    />
);
};

export default InviteManager;
