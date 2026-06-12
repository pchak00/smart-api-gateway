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
            tooltip={!isSuperAdmin ? 'Owner required' : undefined}
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
              <thead className="bg-slate-950/35">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">API Key</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {clients.map((client, index) => {
                  const routeId = client.id ?? index + 1;
                  const planName = client.plan?.planName ?? client.planName ?? 'Unknown';

                  return (
                    <tr key={client.id ?? client.apiKey} className="hover:bg-slate-900">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Server className="text-slate-600" size={16} aria-hidden="true" />
                          <span className="text-sm font-medium text-slate-100">{client.clientName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{client.apiKey}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-300">
                          {planName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          client.active
                            ? 'bg-emerald-950/50 text-emerald-300'
                            : 'bg-red-950/50 text-red-300'
                        }`}>
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm">
                        <Link to={`/clients/${routeId}`} className="text-slate-300 hover:text-slate-100">
                          View
                        </Link>
                        <button
                          type="button"
                          disabled={!isSuperAdmin}
                          title={!isSuperAdmin ? 'Owner required' : undefined}
                          className="ml-4 text-red-300/80 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
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
