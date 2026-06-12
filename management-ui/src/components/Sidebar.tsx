import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LockKeyhole,
  LucideIcon,
  Route,
  ShieldAlert,
  UserCog,
  Users
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import pacificLogo from '../assets/pacific-logo.png';

interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
  requiresSuperAdmin?: boolean;
}

const MENU_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Clients', path: '/clients', icon: Users },
  { label: 'Plans', path: '/plans', icon: CreditCard },
  { label: 'Route Limits', path: '/route-limits', icon: Route },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Abuse Alerts', path: '/abuse-alerts', icon: ShieldAlert },
  { label: 'Admin Users', path: '/admin-users', icon: UserCog, requiresSuperAdmin: true }
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
      message: 'You need Owner access to perform this action.',
      type: 'error',
      duration: 3000,
      dismissible: true
    });
  };

  return (
    <aside className="flex h-screen w-72 flex-col bg-slate-950 text-slate-300">
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <img
            src={pacificLogo}
            alt="pacific logo"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div>
            <h1 className="text-base font-semibold tracking-normal text-slate-100">pacific</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
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
                className="mb-1 flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-900/70"
                aria-disabled="true"
              >
                <Icon size={17} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                <LockKeyhole size={14} aria-hidden="true" />
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-slate-900 text-slate-100'
                  : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300'
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1 w-1 rounded-full bg-slate-500" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
