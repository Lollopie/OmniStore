import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Register from './features/auth/Register';
import Login from './features/auth/Login';
import Inventory from './features/inventory/Inventory.tsx';
import NavBar from './components/NavBar.tsx';
import './assets/index.css';
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
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading your session...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <NavBar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        {/* Guest Only Routes - Pass isAuthenticated as a prop now */}
        <Route element={<GuestRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated}/>} />
          <Route path="/logout" element={<Navigate to="/login" replace />} />
        </Route>

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          {/* Your Root Page / Dashboard goes here */}
          <Route path="/" element={<Inventory />} />

          {/* You can easily add more protected routes here later:
        <Route path="/dashboard" element={<Dashboard />} />
        */}
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}