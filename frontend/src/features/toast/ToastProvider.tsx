import { useState, useCallback, type ReactNode } from 'react';
import type { Toast } from './useToast.ts';
import { ToastContext } from './useToast.ts';
interface ToastProviderProps {
  children: ReactNode;
}
const VARIANTS = {
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
  error: "alert-error",
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: keyof typeof VARIANTS = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev: Toast[]) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);



  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      <div className="toast toast-end toast-bottom z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert ${VARIANTS[toast.type || 'info']} transition-all duration-300 flex justify-between gap-2`}
          >
            <span>{toast.message}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => removeToast(toast.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};