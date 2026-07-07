import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleUserRound,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  LucideIcon,
  Route,
  ShieldAlert,
  SlidersHorizontal,
  UserCog,
  Users
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { getRoleLabel } from '../utils/roles';
import { pacificWaveMark } from '../assets/brand';

interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
  requiresAdminUsersAccess?: boolean;
}

const MENU_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Clients', path: '/clients', icon: Users },
  { label: 'Plans', path: '/plans', icon: CreditCard },
  { label: 'Route Limits', path: '/route-limits', icon: Route },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Abuse Alerts', path: '/abuse-alerts', icon: ShieldAlert },
  { label: 'Admin Users', path: '/admin-users', icon: UserCog, requiresAdminUsersAccess: true }
];

const SETTINGS_ITEMS: SidebarItem[] = [
  { label: 'Gateway settings', path: '/settings/gateway', icon: SlidersHorizontal },
  { label: 'Provisioning', path: '/settings/provisioning', icon: KeyRound }
];

interface SidebarProps {
  isSuperAdmin: boolean;
  isCollapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

interface CollapsedTooltipProps {
  label: string;
}

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ');

const CollapsedTooltip: React.FC<CollapsedTooltipProps> = ({ label }) => (
  <span
    role="tooltip"
    className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-lg shadow-black/25 ring-1 ring-slate-800/70 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
  >
    {label}
  </span>
);

export const Sidebar: React.FC<SidebarProps> = ({
  isSuperAdmin,
  isCollapsed = false,
  className = 'h-screen w-72',
  onNavigate,
  onToggleCollapse
}) => {
  const location = useLocation();
  const { showToast } = useToast();
  const { logout, role, username } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const canCollapse = Boolean(onToggleCollapse);

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
  const roleLabel = getRoleLabel(role);
  const toggleLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const accountTooltipLabel = `Signed in as ${roleLabel}`;

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
    <aside className={`flex flex-col bg-slate-950 text-slate-300 ${className}`}>
      <div className={cx('px-4 py-5', isCollapsed && 'px-3')}>
        <div className="group relative">
          {canCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={toggleLabel}
              aria-expanded={!isCollapsed}
              className={cx(
                'flex w-full items-center rounded-lg py-1.5 transition-colors duration-150 hover:bg-slate-900/45 focus:outline-none focus:ring-2 focus:ring-slate-700/35',
                isCollapsed ? 'justify-center px-0' : 'justify-between gap-3 px-2'
              )}
            >
              {isCollapsed ? (
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                  <img
                    src={pacificWaveMark}
                    alt=""
                    className="absolute h-8 w-8 object-contain opacity-100 transition-opacity duration-150 group-hover:opacity-0 group-focus-visible:opacity-0"
                  />
                  <ChevronRight
                    size={19}
                    aria-hidden="true"
                    className="absolute text-slate-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </span>
              ) : (
                <>
                  <span className="flex min-w-0 items-center gap-3">
                    <img
                      src={pacificWaveMark}
                      alt=""
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    <span className="overflow-hidden whitespace-nowrap text-base font-semibold text-slate-100">
                      pacific
                    </span>
                  </span>
                  <ChevronLeft
                    size={17}
                    aria-hidden="true"
                    className="shrink-0 text-slate-600 opacity-55 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </>
              )}
            </button>
          ) : (
            <Link
              to="/"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-900/45"
              aria-label="pacific dashboard"
            >
              <img
                src={pacificWaveMark}
                alt="pacific logo"
                className="h-8 w-8 shrink-0 object-contain"
              />
              <span className="text-base font-semibold text-slate-100">pacific</span>
            </Link>
          )}
          {canCollapse && <CollapsedTooltip label={toggleLabel} />}
        </div>
      </div>

      <nav className={cx('flex-1 px-3 py-2', isCollapsed ? 'overflow-visible' : 'overflow-y-auto')}>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
          const isRestricted = item.requiresAdminUsersAccess && !isSuperAdmin;

          if (isRestricted) {
            return (
              <div key={item.path} className="group relative mb-1">
                <button
                  type="button"
                  onClick={handleRestrictedClick}
                  className={cx(
                    'flex w-full cursor-not-allowed items-center rounded-lg py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-900/45 focus:outline-none focus:ring-2 focus:ring-slate-700/35',
                    isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                  )}
                  aria-disabled="true"
                  aria-label={isCollapsed ? `${item.label}. Admin required` : undefined}
                >
                  <Icon size={17} aria-hidden="true" className="shrink-0" />
                  <span
                    className={cx(
                      'min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[opacity,width] duration-150 ease-out',
                      isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                  {!isCollapsed && <LockKeyhole size={14} aria-hidden="true" className="shrink-0" />}
                </button>
                {isCollapsed && <CollapsedTooltip label={`${item.label} · Admin required`} />}
              </div>
            );
          }

          return (
            <div key={item.path} className="group relative mb-1">
              <Link
                to={item.path}
                onClick={onNavigate}
                aria-label={isCollapsed ? item.label : undefined}
                className={cx(
                  'flex items-center rounded-lg py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700/35',
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
                  isActive
                    ? 'bg-slate-900/65 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-900/45 hover:text-slate-200'
                )}
              >
                <Icon size={17} aria-hidden="true" className="shrink-0" />
                <span
                  className={cx(
                    'overflow-hidden whitespace-nowrap transition-[opacity,width] duration-150 ease-out',
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  )}
                >
                  {item.label}
                </span>
              </Link>
              {isCollapsed && <CollapsedTooltip label={item.label} />}
            </div>
          );
        })}

        <div
          className={cx(
            'mt-5 overflow-hidden px-3 pb-2 text-xs font-medium uppercase tracking-wide text-slate-700 transition-[height,opacity] duration-150 ease-out',
            isCollapsed ? 'h-0 opacity-0' : 'h-6 opacity-100'
          )}
        >
          Settings
        </div>
        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

          return (
            <div key={item.path} className="group relative mb-1">
              <Link
                to={item.path}
                onClick={onNavigate}
                aria-label={isCollapsed ? item.label : undefined}
                className={cx(
                  'flex items-center rounded-lg py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700/35',
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
                  isActive
                    ? 'bg-slate-900/65 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-900/45 hover:text-slate-200'
                )}
              >
                <Icon size={17} aria-hidden="true" className="shrink-0" />
                <span
                  className={cx(
                    'overflow-hidden whitespace-nowrap transition-[opacity,width] duration-150 ease-out',
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  )}
                >
                  {item.label}
                </span>
              </Link>
              {isCollapsed && <CollapsedTooltip label={item.label} />}
            </div>
          );
        })}
      </nav>

      <div ref={profileRef} className="relative px-3 pb-4 pt-3">
        {isProfileOpen && (
          <div
            role="menu"
            className={cx(
              'absolute z-50 rounded-lg bg-slate-900/95 p-1 shadow-xl shadow-black/20 ring-1 ring-slate-800/60 backdrop-blur',
              isCollapsed ? 'bottom-3 left-full ml-3 w-56' : 'bottom-16 left-3 right-3'
            )}
          >
            <div className="px-3 py-2 text-xs text-slate-500">
              Signed in as <span className="text-slate-300">{roleLabel}</span>
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

        <div className="group relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
            aria-label="Open account menu"
            onClick={() => setIsProfileOpen((open) => !open)}
            className={cx(
              'flex w-full items-center rounded-lg py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-slate-900/55 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/35',
              isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            )}
          >
            {isCollapsed ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors group-hover:text-slate-200 group-focus-within:text-slate-200">
                <CircleUserRound size={18} aria-hidden="true" />
              </span>
            ) : (
              <>
                <span className="truncate font-medium">{displayUsername}</span>
                <ChevronUp
                  size={15}
                  aria-hidden="true"
                  className={`shrink-0 text-slate-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>
          {isCollapsed && !isProfileOpen && <CollapsedTooltip label={accountTooltipLabel} />}
        </div>
      </div>
    </aside>
  );
};
