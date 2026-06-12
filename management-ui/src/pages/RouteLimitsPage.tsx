import React from 'react';
import { Plus, Route } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { demoPlansList, demoRouteLimitsList } from '../utils/demoData';
import { PrimaryButton } from '../components/Button';
import { DemoBadge, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { getPlanLabel } from '../utils/display';

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
            tooltip={!isSuperAdmin ? 'Admin required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Add Route Limit
          </PrimaryButton>
        }
      />

      <section>
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
              {demoRouteLimitsList.map((limit) => {
                const planName = demoPlansList.find((plan) => plan.id === limit.planId)?.planName ?? 'Unknown';

                return (
                  <tr key={`${limit.planId}-${limit.routePattern}`} className="transition-colors hover:bg-slate-900/35">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Route className="text-slate-600" size={16} aria-hidden="true" />
                        <span className="font-mono text-sm text-slate-100">{limit.routePattern}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {getPlanLabel(planName)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{limit.requestsPerMinute}</td>
                    <td className="px-4 py-4 text-right text-sm">
                      <RowActions
                        actions={[
                          {
                            label: 'Edit',
                            disabled: !isSuperAdmin,
                            title: !isSuperAdmin ? 'Admin required' : undefined
                          },
                          {
                            label: 'Delete',
                            tone: 'danger',
                            disabled: !isSuperAdmin,
                            title: !isSuperAdmin ? 'Admin required' : undefined
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
      </section>
    </div>
  );
};
