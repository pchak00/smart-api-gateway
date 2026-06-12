import React from 'react';
import { useToast } from '../hooks/useToast';

export const ToastManager: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg text-white max-w-sm flex items-start gap-3 animate-in slide-in-from-top ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          role="alert"
        >
          <span className="flex-1">{toast.message}</span>
          {toast.dismissible && (
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white hover:opacity-80 font-bold text-lg leading-none"
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

