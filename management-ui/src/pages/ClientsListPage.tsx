import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Server, Users } from 'lucide-react';
import { api } from '../api/client';
import { ClientDto, PlanDto } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { ListSearch } from '../components/ListSearch';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { getPlanLabel } from '../utils/display';
import { getApiErrorMessage } from '../utils/apiError';
import { matchesSearch, normalizeSearch } from '../utils/search';

export const ClientsListPage: React.FC = () => {
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientDto | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPlanId, setNewClientPlanId] = useState('');
  const [newClientActive, setNewClientActive] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
      setErrorMessage('Backend clients are unavailable right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlans(await api.getPlans());
      } catch (error) {
        console.error('Failed to load plans for client actions:', error);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    if (!newClientPlanId && plans[0]?.id !== undefined) {
      setNewClientPlanId(String(plans[0].id));
    }
  }, [newClientPlanId, plans]);

  const resetCreateForm = () => {
    setNewClientName('');
    setNewClientPlanId(plans[0]?.id !== undefined ? String(plans[0].id) : '');
    setNewClientActive(true);
  };

  const handleCreateClient = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate || !newClientPlanId) return;

    setIsSubmitting(true);
    try {
      await api.createClient({
        name: newClientName.trim(),
        planId: Number(newClientPlanId),
        active: newClientActive
      });
      showToast({ message: 'Client created.', type: 'success' });
      resetCreateForm();
      setIsCreateOpen(false);
      await loadClients();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not create client.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPlanEdit = (client: ClientDto) => {
    setEditingClient(client);
    const currentPlan = plans.find((plan) => plan.planName === (client.plan?.planName ?? client.planName));
    setSelectedPlanId(currentPlan?.id !== undefined ? String(currentPlan.id) : '');
  };

  const handleUpdateClientPlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate || !editingClient?.id || !selectedPlanId) return;

    setIsSubmitting(true);
    try {
      await api.updateClient(editingClient.id, { planId: Number(selectedPlanId) });
      showToast({ message: 'Client plan updated.', type: 'success' });
      setEditingClient(null);
      await loadClients();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not update client plan.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (client: ClientDto) => {
    if (!canMutate || !client.id) return;
    if (!window.confirm(`Delete ${client.clientName}?`)) return;

    setIsSubmitting(true);
    try {
      await api.deleteClient(client.id);
      showToast({ message: 'Client deleted.', type: 'success' });
      await loadClients();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not delete client.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasRowsWithoutIds = clients.some((client) => client.id === undefined);
  const trimmedSearchQuery = normalizeSearch(searchQuery);
  const filteredClients = useMemo(() => (
    clients.filter((client) => {
      const planName = client.plan?.planName ?? client.planName ?? '';
      const statusLabel = client.active ? 'active' : 'inactive';

      return matchesSearch([
        client.clientName,
        client.apiKey,
        planName,
        getPlanLabel(planName),
        statusLabel
      ], trimmedSearchQuery);
    })
  ), [clients, trimmedSearchQuery]);
  const clientResultLabel = trimmedSearchQuery
    ? `${filteredClients.length} ${filteredClients.length === 1 ? 'result' : 'results'}`
    : `${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`;
  const clientsMeta = hasRowsWithoutIds || errorMessage ? (
    <div className="flex flex-wrap items-center gap-3">
      {hasRowsWithoutIds && (
        <span className="text-xs text-slate-500">
          Some client rows are missing ids, so detail and mutation actions stay disabled for those rows.
        </span>
      )}
      {errorMessage && <span className="text-xs text-slate-500">{errorMessage}</span>}
    </div>
  ) : undefined;

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Review API consumers, their keys, assigned plans, and current activation state."
        meta={clientsMeta}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ListSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search clients..."
          resultLabel={!isLoading && !errorMessage ? clientResultLabel : undefined}
        />
        <div className="flex shrink-0">
          <PrimaryButton
            type="button"
            disabled={!canMutate}
            tooltip={!canMutate ? 'Admin required' : undefined}
            onClick={() => {
              resetCreateForm();
              setEditingClient(null);
              setIsCreateOpen((open) => !open);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Create Client
          </PrimaryButton>
        </div>
      </div>

      {isCreateOpen && (
        <form onSubmit={handleCreateClient} className="mb-8 grid gap-4 border-y border-slate-800/40 py-5 md:grid-cols-[minmax(0,1fr)_12rem_8rem_auto] md:items-end">
          <label className="block text-sm text-slate-500">
            Client name
            <input
              value={newClientName}
              onChange={(event) => setNewClientName(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Plan
            <select
              value={newClientPlanId}
              onChange={(event) => setNewClientPlanId(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{getPlanLabel(plan.planName)}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={newClientActive}
              onChange={(event) => setNewClientActive(event.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
            />
            Active
          </label>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={isSubmitting || plans.length === 0}>
              Create
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      {editingClient && (
        <form onSubmit={handleUpdateClientPlan} className="mb-8 flex flex-wrap items-end gap-4 border-y border-slate-800/40 py-5">
          <div className="min-w-56 flex-1">
            <p className="text-sm font-medium text-slate-100">{editingClient.clientName}</p>
            <p className="mt-1 text-xs text-slate-500">Change assigned plan</p>
          </div>
          <label className="block min-w-48 text-sm text-slate-500">
            Plan
            <select
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            >
              <option value="" disabled>Select plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{getPlanLabel(plan.planName)}</option>
              ))}
            </select>
          </label>
          <PrimaryButton type="submit" disabled={isSubmitting || !selectedPlanId}>
            Save
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => setEditingClient(null)}>
            Cancel
          </SecondaryButton>
        </form>
      )}

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading clients...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={Users}
            title="Clients unavailable"
            description={errorMessage}
          />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients to show"
            description="Client records will appear here once the gateway returns them."
          />
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients match this search."
            description="Clear the search to show all clients."
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
                {filteredClients.map((client) => {
                  const hasBackendId = typeof client.id === 'number';
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
                            hasBackendId
                              ? { label: 'View', to: `/clients/${client.id}` }
                              : {
                                  label: 'View',
                                  disabled: true,
                                  title: 'Client response does not include an id'
                            },
                            {
                              label: 'Change plan',
                              disabled: !canMutate || !hasBackendId || plans.length === 0,
                              title: !canMutate
                                ? 'Admin required'
                                : !hasBackendId
                                  ? 'Client response does not include an id'
                                  : plans.length === 0
                                    ? 'Plans are unavailable'
                                    : undefined,
                              onClick: () => startPlanEdit(client)
                            },
                            {
                              label: 'Delete',
                              tone: 'danger',
                              disabled: !canMutate || !hasBackendId,
                              title: !canMutate
                                ? 'Admin required'
                                : !hasBackendId
                                  ? 'Client response does not include an id'
                                  : undefined,
                              onClick: () => handleDeleteClient(client)
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
