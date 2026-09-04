import AuthForm from '../auth/authForm/AuthForm.tsx';

const InviteManager = () => {
  return (
    <AuthForm
      title="Create an Account"
      buttonText="Register"
      endpoint={window.location.pathname + "?token=" + new URLSearchParams(window.location.search).get("token")}
      successMessage="Registration successful! You can now log in."
      onSuccess={() => {}}
      handleResponse={() => {}}
    />
);
};

export default InviteManager;