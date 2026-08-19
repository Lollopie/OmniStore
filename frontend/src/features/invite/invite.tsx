import MainPage from '../../components/MainPage';
import AuthForm from '../auth/authForm/AuthForm.tsx';

const InviteManager = () => {
  return (
    <MainPage>
      <AuthForm
        title="Create an Account"
        buttonText="Register"
        endpoint={window.location.pathname + "?token=" + new URLSearchParams(window.location.search).get("token")}
        successMessage="Registration successful! You can now log in."
        onSuccess={() => {}}
        handleResponse={() => {}}
      />
    </MainPage>
);
};

export default InviteManager;