import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SecondaryButton } from './Button';
import { getRoleLabel } from '../utils/roles';

interface TopBarProps {
  title?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title = 'Dashboard' }) => {
  const { logout, role, username } = useAuth();
  const roleLabel = getRoleLabel(role);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="flex items-center justify-between bg-slate-950 px-8 py-5">
      <div>
        <h2 className="text-xl font-semibold tracking-normal text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right text-sm">
          <span className="font-medium text-slate-300">
            {username || 'admin'}
          </span>
          <span className="mx-2 text-slate-700">/</span>
          <span className="text-slate-500">{roleLabel}</span>
        </div>

        <SecondaryButton onClick={handleLogout} className="px-3 text-xs">
          <LogOut size={16} aria-hidden="true" />
          Logout
        </SecondaryButton>
      </div>
    </header>
  );
};
