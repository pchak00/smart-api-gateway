import React from 'react';
import { Plus, Route } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { demoPlansList, demoRouteLimitsList } from '../utils/demoData';
import { PrimaryButton } from '../components/Button';
import { DemoBadge, PageHeader, Panel } from '../components/PageShell';

export const RouteLimitsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div>
      <PageHeader
        title="Route Limits"
        description="Review route-level overrides for endpoints that need different request quotas than their plan default."
        meta={<DemoBadge>Seeded route policy preview</DemoBadge>}
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'Owner required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Add Route Limit
          </PrimaryButton>
        }
      />

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-950/35">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Route</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Requests/min</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {demoRouteLimitsList.map((limit) => {
                const planName = demoPlansList.find((plan) => plan.id === limit.planId)?.planName ?? 'Unknown';

                return (
                  <tr key={`${limit.planId}-${limit.routePattern}`} className="hover:bg-slate-900">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Route className="text-slate-600" size={16} aria-hidden="true" />
                        <span className="font-mono text-sm text-slate-100">{limit.routePattern}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-300">
                        {planName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{limit.requestsPerMinute}</td>
                    <td className="px-5 py-4 text-right text-sm">
                      <button
                        type="button"
                        disabled={!isSuperAdmin}
                        title={!isSuperAdmin ? 'Owner required' : undefined}
                        className="text-slate-300 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>
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
      </Panel>
    </div>
  );
};
