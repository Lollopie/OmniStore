import { Navigate, Outlet } from 'react-router-dom';

// Helper to check authentication
const isAuthenticated = () => {
  return !!localStorage.getItem('token'); // Returns true if token exists
};

// Protects routes that require authentication
export function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

// Protects routes that should only be seen by guests (Login/Register)
export function GuestRoute() {
  return !isAuthenticated() ? <Outlet /> : <Navigate to="/" replace />;
}