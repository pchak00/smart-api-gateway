import React from 'react';
import { Plus, UserCog } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PrimaryButton } from '../components/Button';
import { EmptyState, PageHeader, Panel } from '../components/PageShell';

export const AdminUsersPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div>
      <PageHeader
        eyebrow="Access control"
        title="Admin Users"
        description="Manage platform operators and their access level. This section remains restricted to SUPER_ADMIN users."
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Create Admin
          </PrimaryButton>
        }
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-950/70 px-5 py-3">
          <div className="grid grid-cols-[1fr_12rem_10rem] text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Username</span>
            <span>Role</span>
            <span className="text-right">Actions</span>
          </div>
        </div>
        <EmptyState
          icon={UserCog}
          title="Admin user table is ready"
          description="Admin user records will appear here once that read view is connected in a later milestone."
        />
      </Panel>
    </div>
  );
};
