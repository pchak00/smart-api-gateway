import React from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { demoPlansList } from '../utils/demoData';
import { PrimaryButton } from '../components/Button';
import { DemoBadge, PageHeader, Panel } from '../components/PageShell';

export const PlansPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div>
      <PageHeader
        eyebrow="Quota catalog"
        title="Plans"
        description="Manage the plan tiers that define default request quotas for API consumers."
        meta={<DemoBadge>Seeded plan preview</DemoBadge>}
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'SUPER_ADMIN required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Create Plan
          </PrimaryButton>
        }
      />

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-slate-800 bg-slate-950/70">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Requests/min</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {demoPlansList.map((plan) => (
                <tr key={plan.planName} className="hover:bg-slate-900">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md border border-slate-800 bg-slate-950 p-2 text-blue-200">
                        <CreditCard size={16} aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium text-slate-100">{plan.planName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{plan.requestsPerMinute}</td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
