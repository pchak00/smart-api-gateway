import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

export const AppLayout: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar isSuperAdmin={isSuperAdmin} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-auto bg-slate-950">
          <div className="mx-auto w-full max-w-7xl px-8 pb-10 pt-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
