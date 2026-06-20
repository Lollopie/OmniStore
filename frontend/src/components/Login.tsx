import React, { useState } from 'react';
import './Register.css';
import NavBar from './NavBar.tsx';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUsername: string = username.trim();
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username:trimmedUsername, password:password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(Array.isArray(data.message) ? data.message[0] : data.message);
    } else {
      alert('Login successful!');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <NavBar />
      <main className="flex flex-1 justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md translate-y-[10%] rounded-lg">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Login</h2>

          {error && <p className="mb-4 text-sm text-red-500 font-medium">{error}</p>}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-800">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border bg-gray-50 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-gray-50 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button type="submit" className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition">
            Login
          </button>
        </form>
      </main>
    </div>
  );
}