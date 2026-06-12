import React from 'react';
import { useToast } from '../hooks/useToast';

export const ToastManager: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex max-w-sm items-start gap-3 rounded-lg border p-4 text-sm shadow-xl shadow-black/30 ${
            toast.type === 'success' ? 'border-emerald-400/30 bg-emerald-950 text-emerald-100' :
            toast.type === 'error' ? 'border-red-400/30 bg-red-950 text-red-100' :
            toast.type === 'warning' ? 'border-amber-400/30 bg-amber-950 text-amber-100' :
            'border-blue-400/30 bg-blue-950 text-blue-100'
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
