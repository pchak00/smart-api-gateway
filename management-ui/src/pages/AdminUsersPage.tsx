import React, { useEffect, useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { PrimaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { AdminUserDto } from '../types';
import { getRoleLabel } from '../utils/roles';

export const AdminUsersPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const writeTooltip = !isSuperAdmin
    ? 'Admin required'
    : 'Admin user write controls need forms before they are wired';

  useEffect(() => {
    const loadAdminUsers = async () => {
      try {
        const data = await api.getAdminUsers();
        setAdminUsers(data);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load admin users:', error);
        setAdminUsers([]);
        setErrorMessage('Backend admin users are unavailable right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminUsers();
  }, []);

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Manage platform operators and their access level. This section is restricted to Admin users."
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
        actions={
          <PrimaryButton
            disabled
            tooltip={writeTooltip}
          >
            <Plus size={16} aria-hidden="true" />
            Create Admin
          </PrimaryButton>
        }
      />

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading admin users...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={UserCog}
            title="Admin users unavailable"
            description={errorMessage}
          />
        ) : adminUsers.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No admin users to show"
            description="Admin user records will appear here once the gateway returns them."
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[560px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35">
                {adminUsers.map((adminUser) => (
                  <tr key={adminUser.id ?? adminUser.username} className="transition-colors hover:bg-slate-900/35">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <UserCog className="text-slate-600" size={16} aria-hidden="true" />
                        <span className="text-sm font-medium text-slate-100">{adminUser.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{getRoleLabel(adminUser.role)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
