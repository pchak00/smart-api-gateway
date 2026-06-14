import React, { useEffect, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { PlanDto } from '../types';
import { PrimaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { getPlanLabel } from '../utils/display';

export const PlansPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const writeTooltip = !isSuperAdmin
    ? 'Admin required'
    : 'Plan write controls need forms before they are wired';

  useEffect(() => {
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

    loadPlans();
  }, []);

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Manage the plan tiers that define default request quotas for API consumers."
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
        actions={
          <PrimaryButton
            disabled
            tooltip={writeTooltip}
          >
            <Plus size={16} aria-hidden="true" />
            Create Plan
          </PrimaryButton>
        }
      />

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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
