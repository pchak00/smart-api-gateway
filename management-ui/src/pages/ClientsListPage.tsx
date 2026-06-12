import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server, Users } from 'lucide-react';
import { api } from '../api/client';
import { demoClientsList } from '../utils/demoData';
import { ClientDto } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PrimaryButton } from '../components/Button';
import { DemoBadge, EmptyState, PageHeader, Panel } from '../components/PageShell';

export const ClientsListPage: React.FC = () => {
  const { role } = useAuth();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const isSuperAdmin = role === 'SUPER_ADMIN';

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
        eyebrow="Consumers"
        title="Clients"
        description="Review API consumers, their keys, assigned plans, and current activation state."
        meta={isDemoData && <DemoBadge>Demo client data</DemoBadge>}
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Create Client
          </PrimaryButton>
        }
      />

      <Panel className="overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading clients...</div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients to show"
            description="Client records will appear here once the gateway returns them."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-800 bg-slate-950/70">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">API Key</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clients.map((client, index) => {
                  const routeId = client.id ?? index + 1;
                  const planName = client.plan?.planName ?? client.planName ?? 'Unknown';

                  return (
                    <tr key={client.id ?? client.apiKey} className="hover:bg-slate-900">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-md border border-slate-800 bg-slate-950 p-2 text-slate-400">
                            <Server size={16} aria-hidden="true" />
                          </div>
                          <span className="text-sm font-medium text-slate-100">{client.clientName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{client.apiKey}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-200">
                          {planName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                          client.active
                            ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                            : 'border border-red-400/20 bg-red-500/10 text-red-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${client.active ? 'bg-cyan-300' : 'bg-red-300'}`} />
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm">
                        <Link to={`/clients/${routeId}`} className="text-blue-200 hover:text-blue-100">
                          View
                        </Link>
                        <button
                          type="button"
                          disabled={!isSuperAdmin}
                          title={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
                          className="ml-4 text-red-200/80 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
