import React from 'react';
import { useToast } from '../hooks/useToast';

export const ToastManager: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex max-w-sm items-start gap-3 rounded-lg p-4 text-sm shadow-xl shadow-black/30 ${
            toast.type === 'success' ? 'bg-emerald-950 text-emerald-100' :
            toast.type === 'error' ? 'bg-red-950 text-red-100' :
            toast.type === 'warning' ? 'bg-amber-950 text-amber-100' :
            'bg-slate-900 text-slate-100'
          }`}
          role="alert"
        >
          <span className="flex-1">{toast.message}</span>
          {toast.dismissible && (
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-current opacity-70 hover:opacity-100"
              aria-label="Close notification"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
