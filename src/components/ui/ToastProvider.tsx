'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'alert' | 'success' | 'info';
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: 'alert' | 'success' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message: string, type: 'alert' | 'success' | 'info' = 'alert') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Notification Container (Top-Right) */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-200"
          >
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600 border border-rose-200 shrink-0 mt-0.5">
              <MingIcon name="notification_line" size={18} />
            </div>

            <div className="flex-1 text-xs">
              <h4 className="font-bold text-slate-900 leading-tight">{toast.title}</h4>
              <p className="mt-1 font-medium text-slate-600 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition p-1 -mr-1 -mt-1"
            >
              <MingIcon name="close_line" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
