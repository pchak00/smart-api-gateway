import React, { FormEvent, useEffect, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PlanDto } from '../types';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { getPlanLabel } from '../utils/display';
import { getApiErrorMessage } from '../utils/apiError';

export const PlansPage: React.FC = () => {
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null);
  const [planName, setPlanName] = useState('');
  const [requestsPerMinute, setRequestsPerMinute] = useState('100');
  const [price, setPrice] = useState('0');
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

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Manage the plan tiers that define default request quotas for API consumers."
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
        actions={
          <PrimaryButton
            type="button"
            disabled={!canMutate}
            tooltip={writeTooltip}
            onClick={startCreate}
          >
            <Plus size={16} aria-hidden="true" />
            Create Plan
          </PrimaryButton>
        }
      />

      {(isCreateOpen || editingPlan) && (
        <form
          onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
          className="mb-8 grid gap-4 border-y border-slate-800/40 py-5 md:grid-cols-[minmax(0,1fr)_10rem_8rem_auto] md:items-end"
        >
          <label className="block text-sm text-slate-500">
            Plan name
            <input
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Requests/min
            <input
              type="number"
              min="1"
              value={requestsPerMinute}
              onChange={(event) => setRequestsPerMinute(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
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
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Requests/min</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35">
                {plans.map((plan) => (
                  <tr key={plan.id ?? plan.planName} className="transition-colors hover:bg-slate-900/35">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="text-slate-600" size={16} aria-hidden="true" />
                        <span className="text-sm font-medium text-slate-100">{getPlanLabel(plan.planName)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{plan.requestsPerMinute}</td>
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
