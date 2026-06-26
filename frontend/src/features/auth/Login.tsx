import AuthForm from './AuthForm.tsx';
interface LoginProps {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function Login({ setIsAuthenticated }: LoginProps) {  return (
    <AuthForm
      title="Login"
      buttonText="Login"
      endpoint="login"
      successMessage='Login successful!'
      onSuccess={() => setIsAuthenticated(true)}
    />
  );
}