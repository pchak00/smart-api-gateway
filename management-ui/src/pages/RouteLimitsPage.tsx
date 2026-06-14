import React, { useEffect, useState } from 'react';
import { Plus, Route } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { RouteLimitDto } from '../types';
import { PrimaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { getPlanLabel } from '../utils/display';

export const RouteLimitsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [routeLimits, setRouteLimits] = useState<RouteLimitDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const writeTooltip = !isSuperAdmin
    ? 'Admin required'
    : 'Route-limit write controls need forms before they are wired';

  useEffect(() => {
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

    loadRouteLimits();
  }, []);

  return (
    <div>
      <PageHeader
        title="Route Limits"
        description="Review route-level overrides for endpoints that need different request quotas than their plan default."
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
        actions={
          <PrimaryButton
            disabled
            tooltip={writeTooltip}
          >
            <Plus size={16} aria-hidden="true" />
            Add Route Limit
          </PrimaryButton>
        }
      />

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
                {routeLimits.map((limit) => {
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
                              disabled: true,
                              title: writeTooltip
                            },
                            {
                              label: 'Delete',
                              tone: 'danger',
                              disabled: true,
                              title: writeTooltip
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
