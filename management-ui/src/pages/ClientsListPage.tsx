import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Server, Users } from 'lucide-react';
import { api } from '../api/client';
import { ClientDto, PlanDto } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { ListSearch } from '../components/ListSearch';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { AppDropdown, DropdownOption } from '../components/AppDropdown';
import { SensitiveValue } from '../components/SensitiveValue';
import {
  ClientApiKeyLifecycleDialogs,
  PendingClientLifecycleAction
} from '../components/ClientApiKeyLifecycleDialogs';
import { formatDateTime, formatRelativeDateTime, getPlanLabel, getServerTimestampDate } from '../utils/display';
import { getApiErrorMessage } from '../utils/apiError';
import { matchesSearch, normalizeSearch } from '../utils/search';
import { ClientApiKeyRotationResponse } from '../types';

type ActivityFilter = 'all' | 'stale';

const staleInactivityDays = 30;
const staleInactivityMs = staleInactivityDays * 24 * 60 * 60 * 1000;

const getLastActiveDate = (client: ClientDto) => getServerTimestampDate(client.lastActiveAt);

const isStaleClient = (client: ClientDto) => {
  if (!client.active) return false;
  if (!client.lastActiveAt) return true;

  const lastActiveDate = getLastActiveDate(client);
  if (!lastActiveDate) return false;

  return Date.now() - lastActiveDate.getTime() >= staleInactivityMs;
};

const getLastActiveLabel = (client: ClientDto) => (
  client.lastActiveAt ? formatRelativeDateTime(client.lastActiveAt) : 'Never'
);

export const ClientsListPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState<PendingClientLifecycleAction | null>(null);
  const [rotatedKey, setRotatedKey] = useState<ClientApiKeyRotationResponse | null>(null);
  const [revealedApiKeyRow, setRevealedApiKeyRow] = useState<string | null>(null);

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

  const handleConfirmRotateApiKey = async () => {
    if (!canMutate || pendingLifecycleAction?.kind !== 'rotate' || !pendingLifecycleAction.client.id) return;

    setIsSubmitting(true);
    try {
      const response = await api.rotateClientApiKey(pendingLifecycleAction.client.id);
      setPendingLifecycleAction(null);
      setRotatedKey(response);
      showToast({ message: 'API key rotated.', type: 'success' });
      await loadClients();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not rotate API key.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDisableClient = async () => {
    if (!canMutate || pendingLifecycleAction?.kind !== 'disable' || !pendingLifecycleAction.client.id) return;

    setIsSubmitting(true);
    try {
      await api.disableClient(pendingLifecycleAction.client.id);
      setPendingLifecycleAction(null);
      showToast({ message: 'Client disabled.', type: 'success' });
      await loadClients();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not disable client.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnableClient = async (client: ClientDto) => {
    if (!canMutate || !client.id) return;

    setIsSubmitting(true);
    try {
      await api.enableClient(client.id);
      showToast({ message: 'Client enabled.', type: 'success' });
      await loadClients();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not enable client.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRotatedKey = async () => {
    if (!rotatedKey?.apiKey) return false;

    try {
      await navigator.clipboard.writeText(rotatedKey.apiKey);
      showToast({ message: 'Copied.', type: 'success' });
      return true;
    } catch {
      showToast({ message: 'Could not copy API key.', type: 'error' });
      return false;
    }
  };

  const closeRotatedKeyDialog = () => {
    setRotatedKey(null);
  };

  const openClientDetail = (client: ClientDto) => {
    if (typeof client.id !== 'number') return;
    navigate(`/clients/${client.id}`);
  };

  const shouldIgnoreRowNavigation = (target: EventTarget | null) => (
    target instanceof HTMLElement &&
    Boolean(target.closest('button, a, input, select, textarea, [role="menu"], [role="listbox"]'))
  );

  const hasRowsWithoutIds = clients.some((client) => client.id === undefined);
  const trimmedSearchQuery = normalizeSearch(searchQuery);
  const filteredClients = useMemo(() => (
    clients.filter((client) => {
      const planName = client.plan?.planName ?? client.planName ?? '';
      const statusLabel = client.active ? 'active' : 'inactive';
      const lastActiveLabel = getLastActiveLabel(client);
      const staleLabel = isStaleClient(client) ? 'stale' : '';
      const matchesActivityFilter = activityFilter === 'all' || isStaleClient(client);

      if (!matchesActivityFilter) return false;

      return matchesSearch([
        client.clientName,
        client.apiKey,
        planName,
        getPlanLabel(planName),
        statusLabel,
        lastActiveLabel,
        staleLabel
      ], trimmedSearchQuery);
    })
  ), [activityFilter, clients, trimmedSearchQuery]);
  const clientResultLabel = trimmedSearchQuery
    ? `${filteredClients.length} ${filteredClients.length === 1 ? 'result' : 'results'}`
    : activityFilter === 'stale'
      ? `${filteredClients.length} stale ${filteredClients.length === 1 ? 'client' : 'clients'}`
      : `${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`;
  const clientsMeta = hasRowsWithoutIds || errorMessage ? (
    <div className="flex flex-wrap items-center gap-3">
      {hasRowsWithoutIds && (
        <span className="text-xs text-slate-500">
          Some client rows are missing ids, so detail and mutation actions stay disabled for those rows.
        </span>
      )}
      {errorMessage && <span className="text-xs text-slate-400">{errorMessage}</span>}
    </div>
  ) : undefined;
  const planOptions = useMemo<DropdownOption[]>(() => (
    plans
      .filter((plan) => plan.id !== undefined)
      .map((plan) => ({
        value: String(plan.id),
        label: getPlanLabel(plan.planName)
      }))
  ), [plans]);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Clients"
        meta={clientsMeta}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row sm:items-start">
          <ListSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search clients..."
            resultLabel={!isLoading && !errorMessage ? clientResultLabel : undefined}
          />
          <label
            className="inline-flex h-9 w-full cursor-pointer items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200 sm:w-auto"
            title="Show active clients with no traffic for 30+ days, including never-active clients."
          >
            <input
              type="checkbox"
              checked={activityFilter === 'stale'}
              onChange={(event) => setActivityFilter(event.target.checked ? 'stale' : 'all')}
              className="peer sr-only"
              aria-label="Show stale clients only"
            />
            <span className="relative h-4 w-8 shrink-0 rounded-full bg-slate-800/85 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-slate-500 after:transition-transform peer-checked:bg-cyan-950/70 peer-checked:after:translate-x-4 peer-checked:after:bg-cyan-300/80 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-600/50" />
            <span className="whitespace-nowrap text-xs font-medium">Stale</span>
          </label>
        </div>
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
        <form onSubmit={handleCreateClient} className="mb-8 grid gap-4 py-2 md:grid-cols-[minmax(0,1fr)_12rem_8rem_auto] md:items-end">
          <label className="block text-sm text-slate-500">
            Client name
            <input
              value={newClientName}
              onChange={(event) => setNewClientName(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            />
          </label>
          <div className="block text-sm text-slate-500">
            <span>Plan</span>
            <AppDropdown
              value={newClientPlanId}
              onChange={setNewClientPlanId}
              options={planOptions}
              ariaLabel="Select client plan"
              className="mt-2"
              disabled={plans.length === 0}
            />
          </div>
          <label className="flex items-center gap-3 pb-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={newClientActive}
              onChange={(event) => setNewClientActive(event.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-5 w-9 rounded-full bg-slate-800/80 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-slate-500 after:transition-transform peer-checked:bg-cyan-950/70 peer-checked:after:translate-x-4 peer-checked:after:bg-cyan-300/80 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-600/50" />
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
        <form onSubmit={handleUpdateClientPlan} className="mb-8 flex flex-wrap items-end gap-4 py-2">
          <div className="min-w-56 flex-1">
            <p className="text-sm font-medium text-slate-100">{editingClient.clientName}</p>
            <p className="mt-1 text-xs text-slate-500">Change assigned plan</p>
          </div>
          <div className="block min-w-48 text-sm text-slate-500">
            <span>Plan</span>
            <AppDropdown
              value={selectedPlanId}
              onChange={setSelectedPlanId}
              options={[{ value: '', label: 'Select plan', disabled: true }, ...planOptions]}
              ariaLabel="Select replacement client plan"
              className="mt-2"
              disabled={plans.length === 0}
            />
          </div>
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
            title={
              activityFilter === 'stale'
                ? trimmedSearchQuery
                  ? 'No stale clients match this search.'
                  : 'No stale clients'
                : 'No clients match this search.'
            }
            description={
              activityFilter === 'stale'
                ? trimmedSearchQuery
                  ? 'Clear the search or switch back to all clients.'
                  : 'All active clients have recent traffic.'
                : 'Clear the search to show all clients.'
            }
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">API Key</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Last active</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35">
                {filteredClients.map((client) => {
                  const hasBackendId = typeof client.id === 'number';
                  const planName = client.plan?.planName ?? client.planName ?? 'Unknown';
                  const rowKey = String(client.id ?? client.apiKey);
                  const lastActiveLabel = getLastActiveLabel(client);
                  const lastActiveExact = client.lastActiveAt ? formatDateTime(client.lastActiveAt) : undefined;
                  const isStale = isStaleClient(client);

                  return (
                    <tr
                      key={rowKey}
                      role={hasBackendId ? 'link' : undefined}
                      tabIndex={hasBackendId ? 0 : undefined}
                      aria-label={hasBackendId ? `Open ${client.clientName}` : undefined}
                      onClick={(event) => {
                        if (shouldIgnoreRowNavigation(event.target)) return;
                        openClientDetail(client);
                      }}
                      onKeyDown={(event) => {
                        if (!hasBackendId || shouldIgnoreRowNavigation(event.target)) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openClientDetail(client);
                        }
                      }}
                      className={`transition-colors hover:bg-slate-900/25 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-700/40 ${
                        hasBackendId ? 'cursor-pointer' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Server className="text-slate-600" size={16} aria-hidden="true" />
                          <span className="text-sm font-medium text-slate-100">{client.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <SensitiveValue
                          value={client.apiKey}
                          revealed={revealedApiKeyRow === rowKey}
                          onRevealedChange={(revealed) => setRevealedApiKeyRow(revealed ? rowKey : null)}
                          copyMessage="API key copied"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {getPlanLabel(planName)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-300" title={lastActiveExact}>
                              {lastActiveLabel}
                            </span>
                            {isStale && (
                              <span className="inline-flex rounded-md bg-slate-950/20 px-2 py-0.5 text-xs font-medium text-slate-500">
                                Stale
                              </span>
                            )}
                          </div>
                          {lastActiveExact && (
                            <span className="text-xs text-slate-600">{lastActiveExact}</span>
                          )}
                        </div>
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
                            ...(canMutate ? [
                              {
                                label: 'Rotate API key',
                                disabled: !hasBackendId,
                                title: !hasBackendId ? 'Client response does not include an id' : undefined,
                                onClick: () => setPendingLifecycleAction({ kind: 'rotate', client })
                              },
                              client.active
                                ? {
                                    label: 'Disable client',
                                    tone: 'danger' as const,
                                    disabled: !hasBackendId,
                                    title: !hasBackendId ? 'Client response does not include an id' : undefined,
                                    onClick: () => setPendingLifecycleAction({ kind: 'disable', client })
                                  }
                                : {
                                    label: 'Enable client',
                                    disabled: !hasBackendId,
                                    title: !hasBackendId ? 'Client response does not include an id' : undefined,
                                    onClick: () => handleEnableClient(client)
                                  }
                            ] : []),
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

      <ClientApiKeyLifecycleDialogs
        pendingAction={pendingLifecycleAction}
        rotatedKey={rotatedKey}
        isSubmitting={isSubmitting}
        onCancelPendingAction={() => setPendingLifecycleAction(null)}
        onConfirmRotate={handleConfirmRotateApiKey}
        onConfirmDisable={handleConfirmDisableClient}
        onCloseRotatedKey={closeRotatedKeyDialog}
        onCopyRotatedKey={handleCopyRotatedKey}
      />
    </div>
  );
};
