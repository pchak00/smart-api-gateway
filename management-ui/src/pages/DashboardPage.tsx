import React, { useEffect, useState } from 'react';
import { Activity, CreditCard, Gauge, Route, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client';
import { DashboardSummaryDto } from '../types';
import { useAuth } from '../hooks/useAuth';
import { DemoBadge, PageHeader, Panel } from '../components/PageShell';
import { formatNumber } from '../utils/display';
import { getRoleLabel } from '../utils/roles';

interface MetricCardProps {
  label: string;
  value: number | string;
  helper: string;
  icon: React.ElementType;
  source?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, helper, icon: Icon, source }) => (
  <Panel className="p-5 transition-colors hover:bg-slate-900/45">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-400">{label}</p>
          {source && (
            <span className="rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-500">
              {source}
            </span>
          )}
        </div>
        <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
      </div>
      <Icon className="mt-1 text-slate-600" size={18} aria-hidden="true" />
    </div>
    <p className="mt-4 text-xs leading-5 text-slate-500">{helper}</p>
  </Panel>
);

const valueOrLoading = (value: number | null | undefined, isLoading: boolean) => {
  if (isLoading) return '...';
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Unavailable';

  return formatNumber(value);
};

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();
  const roleLabel = getRoleLabel(role);
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cardSource = isLoading ? 'Loading' : errorMessage ? 'Unavailable' : 'Live';

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getDashboardSummary();
        setSummary(data);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load dashboard summary:', error);
        setSummary(null);
        setErrorMessage('Dashboard summary is unavailable right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Gateway clients, plans, and traffic signals in one focused operations view."
        meta={(
          <div className="flex flex-wrap items-center gap-3">
            <DemoBadge>{errorMessage ? 'Summary unavailable' : 'Live dashboard summary'}</DemoBadge>
            <span className="text-xs text-slate-500">
              {isLoading
                ? 'Loading dashboard summary...'
                : errorMessage ?? 'Cards use backend usage logs, clients, plans, route limits, and persisted abuse alerts.'}
            </span>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Clients"
          value={valueOrLoading(summary?.clientCount, isLoading)}
          helper="Gateway consumers from the clients repository."
          icon={Users}
          source={cardSource}
        />
        <MetricCard
          label="Plans"
          value={valueOrLoading(summary?.planCount, isLoading)}
          helper="Quota tiers from the plans repository."
          icon={CreditCard}
          source={cardSource}
        />
        <MetricCard
          label="Route limits"
          value={valueOrLoading(summary?.routeLimitCount, isLoading)}
          helper="Route-specific quota overrides."
          icon={Route}
          source={cardSource}
        />
        <MetricCard
          label="Requests"
          value={valueOrLoading(summary?.totalRequests, isLoading)}
          helper={
            typeof summary?.allowedRequests === 'number'
              ? `Allowed: ${formatNumber(summary.allowedRequests)} from persisted usage logs.`
              : 'Allowed request total from persisted usage logs.'
          }
          icon={Activity}
          source={cardSource}
        />
        <MetricCard
          label="Blocked"
          value={valueOrLoading(summary?.blockedRequests, isLoading)}
          helper="Rejected gateway requests from persisted usage logs."
          icon={ShieldCheck}
          source={cardSource}
        />
        <MetricCard
          label="Alerts"
          value={valueOrLoading(summary?.openAlertCount, isLoading)}
          helper="Persisted abuse alerts; alert lifecycle status is not tracked yet."
          icon={ShieldAlert}
          source={cardSource}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.8fr]">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Gauge className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Gateway posture</h2>
              <p className="mt-1 text-sm text-slate-500">
                Rate limits, usage logging, and abuse alerts are the primary operating surfaces.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Access: {roleLabel}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Role-based navigation and restricted actions are preserved.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};
