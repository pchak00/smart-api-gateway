import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

export const AppLayout: React.FC = () => {
  const { role } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isSuperAdmin={isSuperAdmin} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

