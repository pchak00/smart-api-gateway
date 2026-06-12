import React, { useEffect, useState } from 'react';
import { Plus, Server, Users } from 'lucide-react';
import { api } from '../api/client';
import { demoClientsList } from '../utils/demoData';
import { ClientDto } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PrimaryButton } from '../components/Button';
import { DemoBadge, EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { getPlanLabel } from '../utils/display';

export const ClientsListPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await api.getClients();
        setClients(data);
        setIsDemoData(false);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setClients(demoClientsList);
        setIsDemoData(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Review API consumers, their keys, assigned plans, and current activation state."
        meta={isDemoData && <DemoBadge>Demo client data</DemoBadge>}
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'Admin required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Create Client
          </PrimaryButton>
        }
      />

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading clients...</div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients to show"
            description="Client records will appear here once the gateway returns them."
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">API Key</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35">
                {clients.map((client, index) => {
                  const routeId = client.id ?? index + 1;
                  const planName = client.plan?.planName ?? client.planName ?? 'Unknown';

                  return (
                    <tr key={client.id ?? client.apiKey} className="transition-colors hover:bg-slate-900/35">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Server className="text-slate-600" size={16} aria-hidden="true" />
                          <span className="text-sm font-medium text-slate-100">{client.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-400">{client.apiKey}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {getPlanLabel(planName)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          client.active
                            ? 'bg-emerald-950/30 text-emerald-300/90'
                            : 'bg-red-950/30 text-red-300/90'
                        }`}>
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm">
                        <RowActions
                          actions={[
                            { label: 'View', to: `/clients/${routeId}` },
                            {
                              label: 'Delete',
                              tone: 'danger',
                              disabled: !isSuperAdmin,
                              title: !isSuperAdmin ? 'Admin required' : undefined
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
