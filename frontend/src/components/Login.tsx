import AuthForm from './AuthForm.tsx';

export default function Login() {
  return (
    <AuthForm
      title="Login"
      buttonText="Login"
      endpoint="login"
      successMessage='Login successful!'
    />
  );
}