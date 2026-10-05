import { api } from '../../../api/client.ts';
import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from './useAuth.ts';
import { clearUserSession } from '../../../utils/sessionStorage.ts';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // A returning user's access token has usually expired; the client renews it
        await api.get('/auth/status');
        setIsAuthenticated(true);
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