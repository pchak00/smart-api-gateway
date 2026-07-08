import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { PageContainer } from '../components/PageShell';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'pacific:sidebar-collapsed';

const getInitialSidebarCollapsed = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const getPageTitle = (pathname: string) => {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/clients')) return 'Clients';
  if (pathname.startsWith('/plans')) return 'Plans';
  if (pathname.startsWith('/routes') || pathname.startsWith('/route-limits')) return 'Routes';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  if (pathname.startsWith('/abuse-alerts')) return 'Abuse Alerts';
  if (pathname.startsWith('/admin-users')) return 'Admins';
  if (pathname.startsWith('/settings/gateway')) return 'Gateway Settings';
  if (pathname.startsWith('/settings/provisioning') || pathname.startsWith('/provisioning')) return 'Provisioning';

  return 'Dashboard';
};

export const AppLayout: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed));
    } catch {
      // Ignore storage failures so navigation remains usable in restricted browsers.
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileNavOpen]);

  return (
    <div className="pacific-app-shell flex h-dvh w-full overflow-hidden text-slate-100">
      <Sidebar
        isSuperAdmin={isSuperAdmin}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        className={`hidden h-dvh shrink-0 transition-[width] duration-200 ease-out lg:flex ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      />

      {isMobileNavOpen && (
        <div className="pacific-overlay-layer fixed inset-0 z-50 overflow-hidden lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex h-dvh w-[min(19rem,calc(100vw-2rem))] max-w-full">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation"
              className="pacific-icon-focus absolute right-3 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-900/60 hover:text-slate-100"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <Sidebar
              isSuperAdmin={isSuperAdmin}
              className="h-dvh w-full shadow-[18px_0_48px_rgba(2,6,23,0.38)]"
              isCollapsed={false}
              onNavigate={() => setIsMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar title={pageTitle} onMenuClick={() => setIsMobileNavOpen(true)} />

        <main className="pacific-main-surface min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  );
};
