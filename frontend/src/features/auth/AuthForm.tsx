import React, { useState } from 'react';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';

interface AuthFormProps {
  title: string;
  buttonText: string;
  endpoint: string;
  successMessage: string;
  onSuccess?: () => void;
  handleResponse: (data : {warehouses?: string, activeWarehouse?: string, activeRole?: string, message?: string, user_id: string, username: string} ) => void;
}

export default function AuthForm({ title, buttonText, endpoint, successMessage, onSuccess, handleResponse }: AuthFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = username.trim();

    try {
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
        credentials: 'include'
      });

      const data: {warehouses?: string, activeWarehouse?: string, activeRole?: string, message?: string, user_id: string, username: string} = await response.json();
      handleResponse(data);
      if (!response.ok) {
        if( data.message ){
          setError(data.message);
        }
      } else {
        setSuccess(successMessage);
        if (onSuccess) onSuccess();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="flex flex-1 justify-center p-6">
      <div className="w-full max-w-md rounded-lg height:90%">
        <form onSubmit={handleSubmit}>
          <h2 className="mb-6 text-2xl font-bold text-gray-800">{title}</h2>

          {error && <p className="mb-4 text-sm text-red-500 font-medium">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-600 font-medium">{success}</p>}
          <div className="space-y-4">
            <InputField
              label="Username"
              type="text"
              value={username}
              onChange={setUsername}
            />

            <InputField
              className="last:mb-6"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
            />
          </div>
          <Button type="submit">
            {buttonText}
          </Button>
        </form>
      </div>
    </main>
  );
}