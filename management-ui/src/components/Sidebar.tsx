import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronUp,
  CreditCard,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  LucideIcon,
  Route,
  ShieldAlert,
  UserCog,
  Users
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
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
  const { logout, username } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isProfileOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const displayUsername = username || 'admin';

  const handleRestrictedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast({
      message: 'You need Admin access to perform this action.',
      type: 'error',
      duration: 3000,
      dismissible: true
    });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="flex h-screen w-72 flex-col bg-slate-950 text-slate-300">
      <div className="px-4 py-5">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-900/45"
          aria-label="pacific dashboard"
        >
          <img
            src={pacificLogo}
            alt="pacific logo"
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="text-base font-semibold text-slate-100">pacific</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
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
                className="mb-1 flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-900/45"
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
                  ? 'bg-slate-900/65 text-slate-100'
                  : 'text-slate-500 hover:bg-slate-900/45 hover:text-slate-300'
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div ref={profileRef} className="relative px-3 pb-4 pt-3">
        {isProfileOpen && (
          <div
            role="menu"
            className="absolute bottom-16 left-3 right-3 rounded-lg bg-slate-900/95 p-1 shadow-xl shadow-black/20 ring-1 ring-slate-800/60 backdrop-blur"
          >
            <div className="px-3 py-2 text-xs text-slate-500">
              Signed in as <span className="text-slate-300">{displayUsername}</span>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/65 hover:text-slate-100"
            >
              <LogOut size={15} aria-hidden="true" />
              Logout
            </button>
          </div>
        )}

        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isProfileOpen}
          onClick={() => setIsProfileOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-slate-900/55 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/35"
        >
          <span className="truncate font-medium">{displayUsername}</span>
          <ChevronUp
            size={15}
            aria-hidden="true"
            className={`text-slate-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </aside>
  );
};
