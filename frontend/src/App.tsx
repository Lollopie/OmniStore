import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Register from './features/auth/Register';
import Login from './features/auth/Login';
import Inventory from './features/inventory/Inventory.tsx';
import NavBar from './components/NavBar.tsx';
import './assets/index.css';
import Warehouse from './features/warehouse/warehouse.tsx';
import { ToastProvider } from './features/toast';
function ProtectedRoute({ isAuthenticated } : {isAuthenticated: boolean}) {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoute({ isAuthenticated } : {isAuthenticated: boolean}) {
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/auth/status`, {
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
    <ToastProvider>
      <div className="min-h-screen bg-base-200">
        <header className="w-full lg:max-w-3/5 mx-auto py-3 rounded-2xl">
          <NavBar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        </header>
        <div className="h-full py-12 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route element={<GuestRoute isAuthenticated={isAuthenticated} />}>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated}/>} />
              <Route path="/logout" element={<Navigate to="/login" replace />} />
            </Route>

            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              <Route path="/" element={<Warehouse />} />
              <Route path="/inventory" element={<Inventory />} />
            </Route>

            <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
          </Routes>
        </div>
      </div>
    </ToastProvider>
  );
}