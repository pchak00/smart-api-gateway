import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { LockIcon } from './LockIcon';

interface SidebarItem {
  label: string;
  path: string;
  requiresSuperAdmin?: boolean;
}

const MENU_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Clients', path: '/clients' },
  { label: 'Plans', path: '/plans' },
  { label: 'Route Limits', path: '/route-limits' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Abuse Alerts', path: '/abuse-alerts' },
  { label: 'Admin Users', path: '/admin-users', requiresSuperAdmin: true }
];

interface SidebarProps {
  isSuperAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isSuperAdmin }) => {
  const location = useLocation();
  const { showToast } = useToast();

  const handleRestrictedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast({
      message: 'You need SUPER_ADMIN access to perform this action.',
      type: 'error',
      duration: 3000,
      dismissible: true
    });
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Smart API Gateway</h1>
        <p className="text-xs text-gray-400 mt-1">Management Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        {MENU_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
          const isRestricted = item.requiresSuperAdmin && !isSuperAdmin;

          if (isRestricted) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={handleRestrictedClick}
                className="w-full text-left px-6 py-3 opacity-50 cursor-not-allowed flex items-center gap-2 hover:bg-gray-800 transition-colors"
                aria-disabled="true"
              >
                <LockIcon size={16} />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
