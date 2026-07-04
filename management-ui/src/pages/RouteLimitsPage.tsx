import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Route } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PlanDto, RouteLimitDto } from '../types';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { ListSearch } from '../components/ListSearch';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { AppDropdown, DropdownOption } from '../components/AppDropdown';
import { NumberField } from '../components/NumberField';
import { InfoTooltip } from '../components/InfoTooltip';
import { getPlanLabel } from '../utils/display';
import { getApiErrorMessage } from '../utils/apiError';
import { matchesSearch, normalizeSearch } from '../utils/search';

export const RouteLimitsPage: React.FC = () => {
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const [routeLimits, setRouteLimits] = useState<RouteLimitDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<RouteLimitDto | null>(null);
  const [planId, setPlanId] = useState('');
  const [routePattern, setRoutePattern] = useState('/api/');
  const [requestsPerMinute, setRequestsPerMinute] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');
  const writeTooltip = !canMutate
    ? 'Admin required'
    : undefined;

  const loadRouteLimits = async () => {
    try {
      const data = await api.getRouteLimits();
      setRouteLimits(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load route limits:', error);
      setRouteLimits([]);
      setErrorMessage('Backend route limits are unavailable right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRouteLimits();
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await api.getPlans();
        setPlans(data);
        if (!planId && data[0]?.id !== undefined) {
          setPlanId(String(data[0].id));
        }
      } catch (error) {
        console.error('Failed to load plans for route-limit actions:', error);
      }
    };

    loadPlans();
  }, []);

  const resetForm = () => {
    setPlanId(plans[0]?.id !== undefined ? String(plans[0].id) : '');
    setRoutePattern('/api/');
    setRequestsPerMinute('10');
  };

  const handleCreateRouteLimit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate || !planId) return;

    setIsSubmitting(true);
    try {
      await api.createRouteLimit({
        planId: Number(planId),
        routePattern: routePattern.trim(),
        requestsPerMinute: Number(requestsPerMinute)
      });
      showToast({ message: 'Route limit created.', type: 'success' });
      resetForm();
      setIsCreateOpen(false);
      await loadRouteLimits();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not create route limit.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (limit: RouteLimitDto) => {
    setEditingLimit(limit);
    setIsCreateOpen(false);
    setRoutePattern(limit.routePattern ?? limit.path ?? '/api/');
    setRequestsPerMinute(String(limit.requestsPerMinute ?? limit.requestPerMinute ?? 10));
  };

  const handleUpdateRouteLimit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate || !editingLimit?.id) return;

    setIsSubmitting(true);
    try {
      await api.updateRouteLimit(editingLimit.id, {
        routePattern: routePattern.trim(),
        requestPerMinute: Number(requestsPerMinute)
      });
      showToast({ message: 'Route limit updated.', type: 'success' });
      setEditingLimit(null);
      resetForm();
      await loadRouteLimits();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not update route limit.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRouteLimit = async (limit: RouteLimitDto) => {
    if (!canMutate || !limit.id) return;
    const routePath = limit.routePattern ?? limit.path ?? 'this route limit';
    if (!window.confirm(`Delete ${routePath}?`)) return;

    setIsSubmitting(true);
    try {
      await api.deleteRouteLimit(limit.id);
      showToast({ message: 'Route limit deleted.', type: 'success' });
      await loadRouteLimits();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not delete route limit.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const trimmedSearchQuery = normalizeSearch(searchQuery);
  const filteredRouteLimits = useMemo(() => (
    routeLimits.filter((limit) => {
      const planName = limit.planName ?? '';
      const routePath = limit.routePattern ?? limit.path ?? '';
      const requestLimit = limit.requestsPerMinute ?? limit.requestPerMinute;

      return matchesSearch([
        routePath,
        planName,
        getPlanLabel(planName),
        requestLimit
      ], trimmedSearchQuery);
    })
  ), [routeLimits, trimmedSearchQuery]);
  const routeLimitResultLabel = trimmedSearchQuery
    ? `${filteredRouteLimits.length} ${filteredRouteLimits.length === 1 ? 'result' : 'results'}`
    : `${routeLimits.length} ${routeLimits.length === 1 ? 'route limit' : 'route limits'}`;
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
        title="Route Limits"
        titleAccessory={
          <InfoTooltip label="Route limits details">
            Route limits override a plan&apos;s default quota for specific API paths.
          </InfoTooltip>
        }
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ListSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search route limits..."
          resultLabel={!isLoading && !errorMessage ? routeLimitResultLabel : undefined}
        />
        <div className="flex shrink-0">
          <PrimaryButton
            type="button"
            disabled={!canMutate}
            tooltip={writeTooltip}
            onClick={() => {
              setEditingLimit(null);
              resetForm();
              setIsCreateOpen((open) => !open);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add Route Limit
          </PrimaryButton>
        </div>
      </div>

      {(isCreateOpen || editingLimit) && (
        <form
          onSubmit={editingLimit ? handleUpdateRouteLimit : handleCreateRouteLimit}
          className="mb-8 py-2"
        >
          <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)_10rem_auto] md:items-end">
            {!editingLimit && (
              <div className="block text-sm text-slate-500">
                <span>Plan</span>
                <AppDropdown
                  value={planId}
                  onChange={setPlanId}
                  options={planOptions}
                  ariaLabel="Select route limit plan"
                  className="mt-2"
                  disabled={plans.length === 0}
                />
              </div>
            )}
            {editingLimit && (
              <div className="text-sm">
                <p className="text-slate-500">Plan</p>
                <p className="mt-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-300">
                  {getPlanLabel(editingLimit.planName ?? 'Unknown')}
                </p>
              </div>
            )}
            <div className="block text-sm text-slate-500">
              <div className="inline-flex items-center gap-1.5">
                <label htmlFor="route-pattern">Route pattern</label>
                <InfoTooltip label="Route pattern examples">
                  Examples: /api/products exact, /api/users/* one segment, /api/users/** nested routes.
                </InfoTooltip>
              </div>
              <input
                id="route-pattern"
                value={routePattern}
                onChange={(event) => setRoutePattern(event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-slate-600"
                required
              />
            </div>
            <label className="block text-sm text-slate-500">
              Requests/min
              <NumberField
                min={1}
                value={requestsPerMinute}
                onChange={setRequestsPerMinute}
                required
              />
            </label>
            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={isSubmitting || (!editingLimit && plans.length === 0)}>
                {editingLimit ? 'Save' : 'Create'}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingLimit(null);
                  resetForm();
                }}
              >
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </form>
      )}

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading route limits...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={Route}
            title="Route limits unavailable"
            description={errorMessage}
          />
        ) : routeLimits.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No route limits to show"
            description="Route-specific overrides will appear here once the gateway returns them."
          />
        ) : filteredRouteLimits.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No route limits match this search."
            description="Clear the search to show all route limits."
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Requests/min</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35">
                {filteredRouteLimits.map((limit) => {
                  const planName = limit.planName ?? 'Unknown';
                  const routePath = limit.routePattern ?? limit.path ?? 'Unknown route';
                  const requestLimit = limit.requestsPerMinute ?? limit.requestPerMinute;

                  return (
                    <tr key={limit.id ?? `${limit.planId ?? 'plan'}-${routePath}`} className="transition-colors hover:bg-slate-900/35">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Route className="text-slate-600" size={16} aria-hidden="true" />
                          <span className="font-mono text-sm text-slate-100">{routePath}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {getPlanLabel(planName)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {typeof requestLimit === 'number' ? requestLimit : 'Not returned'}
                      </td>
                      <td className="px-4 py-4 text-right text-sm">
                        <RowActions
                          actions={[
                            {
                              label: 'Edit',
                              disabled: !canMutate || !limit.id,
                              title: writeTooltip ?? (!limit.id ? 'Route limit response does not include an id' : undefined),
                              onClick: () => startEdit(limit)
                            },
                            {
                              label: 'Delete',
                              tone: 'danger',
                              disabled: !canMutate || !limit.id,
                              title: writeTooltip ?? (!limit.id ? 'Route limit response does not include an id' : undefined),
                              onClick: () => handleDeleteRouteLimit(limit)
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
