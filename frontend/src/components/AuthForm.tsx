import React, { useState } from 'react';
import './Auth.css';
import NavBar from './NavBar.tsx';
import InputField from './InputField.tsx';

interface AuthFormProps {
  title: string;
  buttonText: string;
  endpoint: string;
  successMessage: string;
}

export default function AuthForm({ title, buttonText, endpoint, successMessage }: AuthFormProps) {
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
      const response = await fetch(`http://localhost:3000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(Array.isArray(data.message) ? data.message[0] : data.message);
      } else {
        setSuccess(successMessage);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <NavBar />
      <main className="flex flex-1 justify-center p-6">
        <div className="w-full max-w-md rounded-lg height:90%">
          <form onSubmit={handleSubmit}>
            <h2 className="mb-6 text-2xl font-bold text-gray-800">{title}</h2>

            {error && <p className="mb-4 text-sm text-red-500 font-medium">{error}</p>}
            {success && <p className="mb-4 text-sm text-green-600 font-medium">{success}</p>}

            <InputField
              label="Username"
              type="text"
              value={username}
              onChange={setUsername}
            />

            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
            />

            <button type="submit" className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition">
              {buttonText}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}