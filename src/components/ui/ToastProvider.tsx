'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'rising' | 'crashing' | 'alert' | 'success' | 'info';
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: 'rising' | 'crashing' | 'alert' | 'success' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_STYLES: Record<
  string,
  { bg: string; icon: string }
> = {
  rising: {
    bg: 'bg-emerald-600 border-emerald-700 text-white',
    icon: 'trending_up_line',
  },
  crashing: {
    bg: 'bg-rose-600 border-rose-700 text-white',
    icon: 'trending_down_line',
  },
  alert: {
    bg: 'bg-[#0050FF] border-blue-700 text-white',
    icon: 'notification_line',
  },
  success: {
    bg: 'bg-emerald-600 border-emerald-700 text-white',
    icon: 'check_circle_line',
  },
  info: {
    bg: 'bg-slate-900 border-slate-950 text-white',
    icon: 'information_line',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (title: string, message: string, type: 'rising' | 'crashing' | 'alert' | 'success' | 'info' = 'alert') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Notification Container (Bottom-Left) */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type || 'alert'] || TOAST_STYLES.alert;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border-2 ${style.bg} p-4 shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-200`}
            >
              <div className="rounded-xl bg-white/20 p-2 text-white shrink-0 mt-0.5">
                <MingIcon name={style.icon} size={18} />
              </div>

              <div className="flex-1 text-xs">
                <h4 className="font-bold text-white leading-tight">{toast.title}</h4>
                <p className="mt-1 font-medium text-white/90 leading-relaxed">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white transition p-1 -mr-1 -mt-1"
              >
                <MingIcon name="close_line" size={16} />
              </button>
            </div>
          );
        })}
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
