import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SecondaryButton } from './Button';

interface TopBarProps {
  title?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title = 'Dashboard' }) => {
  const { logout, role, username } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-8 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Pacific - Smart API Gateway
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-50">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
          <span className="text-sm font-medium text-slate-300">
            {username || 'Admin'} <span className="text-slate-600">/</span>{' '}
            <span className="text-blue-200">{role}</span>
          </span>
        </div>

        <SecondaryButton onClick={handleLogout} className="px-3">
          <LogOut size={16} aria-hidden="true" />
          Logout
        </SecondaryButton>
      </div>
    </header>
  );
};
