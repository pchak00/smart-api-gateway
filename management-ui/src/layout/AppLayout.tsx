import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

const getPageTitle = (pathname: string) => {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/clients') return 'Clients';
  if (pathname.startsWith('/clients/')) return 'Client Details';
  if (pathname === '/plans') return 'Plans';
  if (pathname === '/route-limits') return 'Route Limits';
  if (pathname === '/analytics') return 'Analytics';
  if (pathname === '/abuse-alerts') return 'Abuse Alerts';
  if (pathname === '/admin-users') return 'Admin Users';
  return 'pacific';
};

export const AppLayout: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar isSuperAdmin={isSuperAdmin} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={getPageTitle(location.pathname)} />

        <main className="flex-1 overflow-auto bg-slate-950">
          <div className="mx-auto w-full max-w-7xl p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
