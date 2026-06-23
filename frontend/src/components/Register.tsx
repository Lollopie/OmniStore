import AuthForm from './AuthForm.tsx';

export default function Register() {
  return (
    <AuthForm
      title="Create an Account"
      buttonText="Register"
      endpoint="register"
      successMessage="Registration successful! You can now log in."
      responseCallback={() => {return}}
    />
  );
}