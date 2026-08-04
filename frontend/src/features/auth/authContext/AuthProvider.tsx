import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from './useAuth.ts';
import { clearUserSession } from '../../../utils/sessionStorage.ts';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/auth/status`, {
          method: 'GET',
          credentials: 'include',
        });

        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);
  const logout = () => {
    clearUserSession();
    setIsAuthenticated(false);
  };
  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};