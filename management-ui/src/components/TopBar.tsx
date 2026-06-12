import React from 'react';
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
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Role badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-2 h-2 bg-blue-600 rounded-full" />
          <span className="text-sm font-medium text-gray-700">
            {username || 'Admin'} • <span className="text-blue-600">{role}</span>
          </span>
        </div>

        {/* Logout button */}
        <SecondaryButton onClick={handleLogout}>
          Logout
        </SecondaryButton>
      </div>
    </header>
  );
};
