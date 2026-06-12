import React from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { demoPlansList } from '../utils/demoData';
import { PrimaryButton } from '../components/Button';
import { DemoBadge, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { getPlanLabel } from '../utils/display';

export const PlansPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Manage the plan tiers that define default request quotas for API consumers."
        meta={<DemoBadge>Seeded plan preview</DemoBadge>}
        actions={
          <PrimaryButton
            disabled={!isSuperAdmin}
            tooltip={!isSuperAdmin ? 'Admin required' : undefined}
          >
            <Plus size={16} aria-hidden="true" />
            Create Plan
          </PrimaryButton>
        }
      />

      <section>
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
              {demoPlansList.map((plan) => (
                <tr key={plan.planName} className="transition-colors hover:bg-slate-900/35">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-slate-600" size={16} aria-hidden="true" />
                      <span className="text-sm font-medium text-slate-100">{getPlanLabel(plan.planName)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{plan.requestsPerMinute}</td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
