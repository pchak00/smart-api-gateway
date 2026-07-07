import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ClientDto, PlanDto } from '../types';
import { IconButton, PrimaryButton, SecondaryButton } from '../components/Button';
import { ListSearch } from '../components/ListSearch';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { NumberField } from '../components/NumberField';
import { getPlanLabel } from '../utils/display';
import { getApiErrorMessage } from '../utils/apiError';
import { matchesSearch, normalizeSearch } from '../utils/search';

export const PlansPage: React.FC = () => {
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [clients, setClients] = useState<ClientDto[] | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null);
  const [planName, setPlanName] = useState('');
  const [requestsPerMinute, setRequestsPerMinute] = useState('100');
  const [price, setPrice] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const writeTooltip = !canMutate
    ? 'Admin required'
    : undefined;

  const loadPlans = async () => {
    try {
      const data = await api.getPlans();
      setPlans(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load plans:', error);
      setPlans([]);
      setErrorMessage('Backend plans are unavailable right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setClients(await api.getClients());
      } catch (error) {
        console.error('Failed to load clients for plan enrollment counts:', error);
        setClients(null);
      }
    };

    loadClients();
  }, []);

  const resetForm = () => {
    setPlanName('');
    setRequestsPerMinute('100');
    setPrice('0');
  };

  const startCreate = () => {
    setEditingPlan(null);
    resetForm();
    setIsCreateOpen((open) => !open);
  };

  const startEdit = (plan: PlanDto) => {
    setIsCreateOpen(false);
    setEditingPlan(plan);
    setPlanName(plan.planName ?? '');
    setRequestsPerMinute(String(plan.requestsPerMinute ?? 100));
    setPrice(String(plan.price ?? 0));
  };

  const handleCreatePlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate) return;

    setIsSubmitting(true);
    try {
      await api.createPlan({
        planName: planName.trim(),
        requestsPerMinute: Number(requestsPerMinute),
        price: Number(price)
      });
      showToast({ message: 'Plan created.', type: 'success' });
      resetForm();
      setIsCreateOpen(false);
      await loadPlans();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not create plan.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate || !editingPlan?.id) return;

    setIsSubmitting(true);
    try {
      await api.updatePlan(editingPlan.id, {
        planName: planName.trim(),
        requestsPerMinute: Number(requestsPerMinute),
        price: Number(price)
      });
      showToast({ message: 'Plan updated.', type: 'success' });
      resetForm();
      setEditingPlan(null);
      await loadPlans();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not update plan.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan: PlanDto) => {
    if (!canMutate || !plan.id) return;
    if (!window.confirm(`Delete ${getPlanLabel(plan.planName)}?`)) return;

    setIsSubmitting(true);
    try {
      await api.deletePlan(plan.id);
      showToast({ message: 'Plan deleted.', type: 'success' });
      await loadPlans();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not delete plan.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientCountByPlan = useMemo(() => {
    if (clients === undefined) return undefined;
    if (clients === null) return null;

    return clients.reduce<Record<string, number>>((counts, client) => {
      const planName = client.plan?.planName ?? client.planName;
      if (!planName) return counts;

      counts[planName] = (counts[planName] ?? 0) + 1;
      return counts;
    }, {});
  }, [clients]);

  const getClientCountLabel = (planName: string) => {
    if (clientCountByPlan === undefined) return '...';
    if (!clientCountByPlan) return 'Unavailable';

    const count = clientCountByPlan[planName] ?? 0;
    return `${count} ${count === 1 ? 'client' : 'clients'}`;
  };

  const trimmedSearchQuery = normalizeSearch(searchQuery);
  const filteredPlans = useMemo(() => (
    plans.filter((plan) => {
      const priceLabel = typeof plan.price === 'number'
        ? plan.price === 0
          ? 'Free'
          : `$${plan.price.toFixed(2)}`
        : 'Not returned';

      return matchesSearch([
        plan.planName,
        getPlanLabel(plan.planName),
        plan.requestsPerMinute,
        plan.price,
        priceLabel,
        getClientCountLabel(plan.planName)
      ], trimmedSearchQuery);
    })
  ), [clientCountByPlan, plans, trimmedSearchQuery]);
  const planResultLabel = trimmedSearchQuery
    ? `${filteredPlans.length} ${filteredPlans.length === 1 ? 'result' : 'results'}`
    : `${plans.length} ${plans.length === 1 ? 'plan' : 'plans'}`;

  return (
    <div className="min-w-0">
      <PageHeader
        title="Plans"
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row sm:items-start">
        <ListSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search plans..."
          resultLabel={!isLoading && !errorMessage ? planResultLabel : undefined}
        />
        <IconButton
          type="button"
          disabled={!canMutate}
          tooltip={canMutate ? 'Create plan' : writeTooltip ?? 'Admin required'}
          aria-label="Create plan"
          onClick={startCreate}
        >
          <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
        </IconButton>
      </div>

      {(isCreateOpen || editingPlan) && (
        <form
          onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
          className="mb-8 grid max-w-5xl gap-4 py-2 lg:grid-cols-[minmax(14rem,1fr)_10rem_8rem_auto] lg:items-end"
        >
          <label className="block text-sm text-slate-500">
            Plan name
            <input
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              className="mt-2 quiet-field"
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Requests/min
            <NumberField
              min={1}
              value={requestsPerMinute}
              onChange={setRequestsPerMinute}
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Price
            <NumberField
              min={0}
              step={0.01}
              value={price}
              onChange={setPrice}
              required
            />
          </label>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {editingPlan ? 'Save' : 'Create'}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingPlan(null);
                resetForm();
              }}
            >
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading plans...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={CreditCard}
            title="Plans unavailable"
            description={errorMessage}
          />
        ) : plans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No plans to show"
            description="Plan records will appear here once the gateway returns them."
          />
        ) : filteredPlans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No plans match this search."
            description="Clear the search to show all plans."
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Requests/min</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Clients</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id ?? plan.planName} className="transition-colors hover:bg-slate-900/25">
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-slate-100">{getPlanLabel(plan.planName)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{plan.requestsPerMinute}</td>
                    <td className="px-4 py-4 text-sm text-slate-400">{getClientCountLabel(plan.planName)}</td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {typeof plan.price === 'number'
                        ? plan.price === 0
                          ? 'Free'
                          : `$${plan.price.toFixed(2)}`
                        : 'Not returned'}
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      {plan.id !== undefined && (
                        <RowActions
                          actions={[
                            {
                              label: 'Edit',
                              disabled: !canMutate,
                              title: writeTooltip,
                              onClick: () => startEdit(plan)
                            },
                            {
                              label: 'Delete',
                              tone: 'danger',
                              disabled: !canMutate,
                              title: writeTooltip,
                              onClick: () => handleDeletePlan(plan)
                            }
                          ]}
                        />
                      )}
                    </td>
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
