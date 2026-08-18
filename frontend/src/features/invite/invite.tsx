import MainPage from '../../components/MainPage';
import AuthForm from '../auth/authForm/AuthForm.tsx';

const InviteManager = () => {
  return (
    <MainPage>
      <AuthForm
        title="Create an Account"
        buttonText="Register"
        endpoint={window.location.pathname}
        successMessage="Registration successful! You can now log in."
        onSuccess={() => {}}
        handleResponse={() => {}}
      />
    </MainPage>
);
};

export default InviteManager;