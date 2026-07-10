import AuthForm from './AuthForm.tsx';
import React from 'react';
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
      handleResponse={(data) => {
        localStorage.setItem('user_warehouses', JSON.stringify(data.warehouses));
        localStorage.setItem('activeWarehouse', JSON.stringify(data.activeWarehouse));
        localStorage.setItem('activeRole', JSON.stringify(data.activeRole));
      }}
    />
  );
}