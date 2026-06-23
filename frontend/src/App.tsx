import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Register from './components/Register';
import Login from './components/Login';

function ProtectedRoute({ isAuthenticated }) {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoute({ isAuthenticated }) {
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/auth/status', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
      console.log(`Authentication status: ${isAuthenticated}`);
    };

    checkAuthStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading your session...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Guest Only Routes - Pass isAuthenticated as a prop now */}
      <Route element={<GuestRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated}/>} />
      </Route>

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        {/* Your Root Page / Dashboard goes here */}
        <Route path="/" element={<div className="p-10">Welcome to the Root/Dashboard Page!</div>} />

        {/* You can easily add more protected routes here later:
        <Route path="/dashboard" element={<Dashboard />} />
        */}
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
    </Routes>
  );
}