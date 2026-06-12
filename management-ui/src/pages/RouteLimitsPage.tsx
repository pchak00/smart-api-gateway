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
        eyebrow="Traffic policy"
        title="Route Limits"
        description="Review route-level overrides for endpoints that need different request quotas than their plan default."
        meta={<DemoBadge>Seeded route policy preview</DemoBadge>}
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Add Route Limit
          </PrimaryButton>
        }
      />

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-800 bg-slate-950/70">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Route</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Requests/min</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {demoRouteLimitsList.map((limit) => {
                const planName = demoPlansList.find((plan) => plan.id === limit.planId)?.planName ?? 'Unknown';

                return (
                  <tr key={`${limit.planId}-${limit.routePattern}`} className="hover:bg-slate-900">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md border border-slate-800 bg-slate-950 p-2 text-blue-200">
                          <Route size={16} aria-hidden="true" />
                        </div>
                        <span className="font-mono text-sm text-slate-100">{limit.routePattern}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-200">
                        {planName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{limit.requestsPerMinute}</td>
                    <td className="px-5 py-4 text-right text-sm">
                      <button
                        type="button"
                        disabled={!isSuperAdmin}
                        title={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
                        className="text-blue-200 hover:text-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>
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
      </Panel>
    </div>
  );
};
