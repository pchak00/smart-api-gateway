import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Route } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PlanDto, RouteGroupDto, RouteGroupMatchType, RouteLimitDto } from '../types';
import { IconButton, PrimaryButton, SecondaryButton } from '../components/Button';
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
  const [searchParams] = useSearchParams();
  const createActionRequested = searchParams.get('action') === 'create';
  const [routeLimits, setRouteLimits] = useState<RouteLimitDto[]>([]);
  const [routeGroups, setRouteGroups] = useState<RouteGroupDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<RouteLimitDto | null>(null);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RouteGroupDto | null>(null);
  const [planId, setPlanId] = useState('');
  const [routePattern, setRoutePattern] = useState('/api/');
  const [requestsPerMinute, setRequestsPerMinute] = useState('10');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupActive, setGroupActive] = useState(true);
  const [groupPriority, setGroupPriority] = useState('100');
  const [groupRules, setGroupRules] = useState<Array<{ method: string; pattern: string; matchType: RouteGroupMatchType }>>([
    { method: '', pattern: '/api/', matchType: 'EXACT' }
  ]);
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

  const loadRouteGroups = async () => {
    try {
      const data = await api.getRouteGroups();
      setRouteGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load route groups:', error);
      setRouteGroups([]);
    }
  };

  useEffect(() => {
    loadRouteLimits();
    loadRouteGroups();
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

  const resetGroupForm = () => {
    setGroupName('');
    setGroupDescription('');
    setGroupActive(true);
    setGroupPriority('100');
    setGroupRules([{ method: '', pattern: '/api/', matchType: 'EXACT' }]);
  };

  useEffect(() => {
    if (!createActionRequested || !canMutate) return;
    setEditingLimit(null);
    resetForm();
    setIsCreateOpen(true);
  }, [canMutate, createActionRequested]);

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

  const startEditGroup = (group: RouteGroupDto) => {
    setEditingGroup(group);
    setIsGroupFormOpen(false);
    setGroupName(group.name);
    setGroupDescription(group.description ?? '');
    setGroupActive(group.active);
    setGroupPriority(String(group.priority ?? 0));
    setGroupRules(group.rules.length > 0
      ? group.rules.map((rule) => ({
          method: rule.method ?? '',
          pattern: rule.pattern,
          matchType: rule.matchType
        }))
      : [{ method: '', pattern: '/api/', matchType: 'EXACT' }]
    );
  };

  const buildRouteGroupPayload = () => ({
    name: groupName.trim(),
    description: groupDescription.trim() || null,
    active: groupActive,
    priority: Number(groupPriority),
    rules: groupRules.map((rule) => ({
      method: rule.method.trim() || null,
      pattern: rule.pattern.trim(),
      matchType: rule.matchType
    }))
  });

  const handleCreateRouteGroup = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate) return;

    setIsSubmitting(true);
    try {
      await api.createRouteGroup(buildRouteGroupPayload());
      showToast({ message: 'Route group created.', type: 'success' });
      resetGroupForm();
      setIsGroupFormOpen(false);
      await loadRouteGroups();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not create route group.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRouteGroup = async (event: FormEvent) => {
    event.preventDefault();
    if (!canMutate || !editingGroup?.id) return;

    setIsSubmitting(true);
    try {
      await api.updateRouteGroup(editingGroup.id, buildRouteGroupPayload());
      showToast({ message: 'Route group updated.', type: 'success' });
      setEditingGroup(null);
      resetGroupForm();
      await loadRouteGroups();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not update route group.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRouteGroup = async (group: RouteGroupDto) => {
    if (!canMutate || !group.id) return;
    if (!window.confirm(`Delete ${group.name}?`)) return;

    setIsSubmitting(true);
    try {
      await api.deleteRouteGroup(group.id);
      showToast({ message: 'Route group deleted.', type: 'success' });
      await loadRouteGroups();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not delete route group.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateGroupRule = (
    index: number,
    patch: Partial<{ method: string; pattern: string; matchType: RouteGroupMatchType }>
  ) => {
    setGroupRules((rules) => rules.map((rule, ruleIndex) => (
      ruleIndex === index ? { ...rule, ...patch } : rule
    )));
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
  const routeGroupMatchTypeOptions = useMemo<DropdownOption[]>(() => [
    { value: 'EXACT', label: 'Exact' },
    { value: 'PREFIX', label: 'Prefix' },
    { value: 'GLOB', label: 'Glob' }
  ], []);

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

      <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row sm:items-start">
        <ListSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search route limits..."
          resultLabel={!isLoading && !errorMessage ? routeLimitResultLabel : undefined}
        />
        <IconButton
          type="button"
          disabled={!canMutate}
          tooltip={canMutate ? 'Add route limit' : writeTooltip ?? 'Admin required'}
          aria-label="Add route limit"
          onClick={() => {
            setEditingLimit(null);
            resetForm();
            setIsCreateOpen((open) => !open);
          }}
        >
          <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
        </IconButton>
      </div>

      {(isCreateOpen || editingLimit) && (
        <form
          onSubmit={editingLimit ? handleUpdateRouteLimit : handleCreateRouteLimit}
          className="mb-8 max-w-6xl py-2"
        >
          <div className="grid gap-4 lg:grid-cols-[12rem_minmax(18rem,1fr)_10rem_auto] lg:items-end">
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
                <p className="mt-2 quiet-static-field">
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
                className="mt-2 quiet-field font-mono"
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
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Requests/min</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRouteLimits.map((limit) => {
                  const planName = limit.planName ?? 'Unknown';
                  const routePath = limit.routePattern ?? limit.path ?? 'Unknown route';
                  const requestLimit = limit.requestsPerMinute ?? limit.requestPerMinute;

                  return (
                    <tr key={limit.id ?? `${limit.planId ?? 'plan'}-${routePath}`} className="transition-colors hover:bg-slate-900/25">
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-slate-100">{routePath}</span>
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

      <section className="mt-12 pb-16">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-100">Route groups</h2>
              <InfoTooltip label="Route group priority">
                Analytics operation groups use active groups first; higher priority wins when multiple rules match.
              </InfoTooltip>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {routeGroups.length} {routeGroups.length === 1 ? 'group' : 'groups'}
            </p>
          </div>
          <IconButton
            type="button"
            disabled={!canMutate}
            tooltip={canMutate ? 'Add route group' : writeTooltip ?? 'Admin required'}
            aria-label="Add route group"
            onClick={() => {
              setEditingGroup(null);
              resetGroupForm();
              setIsGroupFormOpen((open) => !open);
            }}
          >
            <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
          </IconButton>
        </div>

        {(isGroupFormOpen || editingGroup) && (
          <form
            onSubmit={editingGroup ? handleUpdateRouteGroup : handleCreateRouteGroup}
            className="mb-8 max-w-6xl py-2"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_7rem_7rem_auto] lg:items-end">
              <label className="block text-sm text-slate-500">
                Group name
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="mt-2 quiet-field"
                  required
                />
              </label>
              <label className="block text-sm text-slate-500">
                Description
                <input
                  value={groupDescription}
                  onChange={(event) => setGroupDescription(event.target.value)}
                  className="mt-2 quiet-field"
                />
              </label>
              <label className="block text-sm text-slate-500">
                Priority
                <input
                  type="number"
                  value={groupPriority}
                  onChange={(event) => setGroupPriority(event.target.value)}
                  className="mt-2 quiet-field"
                  required
                />
              </label>
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={groupActive}
                  onChange={(event) => setGroupActive(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-300 focus:ring-cyan-300/20"
                />
                Active
              </label>
              <div className="flex gap-2">
                <PrimaryButton type="submit" disabled={isSubmitting}>
                  {editingGroup ? 'Save' : 'Create'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setIsGroupFormOpen(false);
                    setEditingGroup(null);
                    resetGroupForm();
                  }}
                >
                  Cancel
                </SecondaryButton>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {groupRules.map((rule, index) => (
                <div
                  key={`${index}-${rule.pattern}`}
                  className="grid gap-3 md:grid-cols-[8rem_minmax(14rem,1fr)_9rem_auto] md:items-end"
                >
                  <label className="block text-sm text-slate-500">
                    Method
                    <input
                      value={rule.method}
                      onChange={(event) => updateGroupRule(index, { method: event.target.value })}
                      className="mt-2 quiet-field uppercase"
                      placeholder="Any"
                    />
                  </label>
                  <label className="block text-sm text-slate-500">
                    Pattern
                    <input
                      value={rule.pattern}
                      onChange={(event) => updateGroupRule(index, { pattern: event.target.value })}
                      className="mt-2 quiet-field font-mono"
                      required
                    />
                  </label>
                  <div className="block text-sm text-slate-500">
                    <span>Match</span>
                    <AppDropdown
                      value={rule.matchType}
                      onChange={(value) => updateGroupRule(index, { matchType: value as RouteGroupMatchType })}
                      options={routeGroupMatchTypeOptions}
                      ariaLabel={`Select match type for rule ${index + 1}`}
                      className="mt-2"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={groupRules.length === 1}
                    onClick={() => setGroupRules((rules) => rules.filter((_, ruleIndex) => ruleIndex !== index))}
                    className="pacific-control-focus rounded px-2.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-900/35 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setGroupRules((rules) => [...rules, { method: '', pattern: '/api/', matchType: 'EXACT' }])}
                className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
              >
                Add rule
              </button>
            </div>
          </form>
        )}

        {routeGroups.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No route groups to show"
            description="Operation groups will appear here once they are created."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Group</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">State</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Rules</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {routeGroups.map((group) => (
                  <tr key={group.id ?? group.name} className="transition-colors hover:bg-slate-900/25">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-100">{group.name}</div>
                      {group.description && (
                        <div className="mt-1 max-w-sm truncate text-xs text-slate-500">{group.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{group.priority}</td>
                    <td className="px-4 py-4 text-sm text-slate-400">{group.active ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-xs text-slate-500">
                        {group.rules.slice(0, 3).map((rule) => (
                          <div key={rule.id ?? `${rule.method ?? 'any'}-${rule.pattern}`} className="font-mono">
                            <span className="text-slate-600">{rule.method ?? 'ANY'}</span>
                            <span className="mx-2 text-slate-700">{rule.matchType}</span>
                            <span className="text-slate-400">{rule.pattern}</span>
                          </div>
                        ))}
                        {group.rules.length > 3 && (
                          <div>{group.rules.length - 3} more rules</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <RowActions
                        actions={[
                          {
                            label: 'Edit',
                            disabled: !canMutate || !group.id,
                            title: writeTooltip ?? (!group.id ? 'Route group response does not include an id' : undefined),
                            onClick: () => startEditGroup(group)
                          },
                          {
                            label: 'Delete',
                            tone: 'danger',
                            disabled: !canMutate || !group.id,
                            title: writeTooltip ?? (!group.id ? 'Route group response does not include an id' : undefined),
                            onClick: () => handleDeleteRouteGroup(group)
                          }
                        ]}
                      />
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
