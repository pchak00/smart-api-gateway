import React from 'react';
import { Plus, UserCog } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PrimaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';

export const AdminUsersPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Manage platform operators and their access level. This section is restricted to Admin users."
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'Admin required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Create Admin
          </PrimaryButton>
        }
      />

      <section>
        <div className="border-b border-slate-800/40 px-4 py-3">
          <div className="grid grid-cols-[1fr_12rem_3rem] text-xs font-medium text-slate-500">
            <span>Username</span>
            <span>Role</span>
            <span className="sr-only text-right">Row actions</span>
          </div>
        </div>
        <EmptyState
          icon={UserCog}
          title="Admin user table is ready"
          description="Admin user records will appear here once that read view is connected in a later milestone."
        />
      </section>
    </div>
  );
};
