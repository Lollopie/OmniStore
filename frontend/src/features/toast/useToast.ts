import { createContext, useContext } from 'react';

export interface Toast {
  id: number;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface ToastContextType {
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};