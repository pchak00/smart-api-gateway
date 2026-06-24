import React, { useEffect, useState } from 'react';
import { Activity, CreditCard, Route, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client';
import { DashboardSummaryDto } from '../types';
import { PageHeader } from '../components/PageShell';
import { formatNumber } from '../utils/display';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon }) => (
  <section className="flex min-h-32 flex-col justify-between rounded-lg bg-slate-900/20 px-5 py-5 transition-colors hover:bg-slate-900/40">
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <Icon className="shrink-0 text-slate-700" size={18} aria-hidden="true" />
    </div>
    <p className="pt-6 text-3xl font-semibold leading-none text-slate-50">{value}</p>
  </section>
);

const valueOrLoading = (value: number | null | undefined, isLoading: boolean) => {
  if (isLoading) return '...';
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Unavailable';

  return formatNumber(value);
};

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Clients"
          value={valueOrLoading(summary?.clientCount, isLoading)}
          icon={Users}
        />
        <MetricCard
          label="Plans"
          value={valueOrLoading(summary?.planCount, isLoading)}
          icon={CreditCard}
        />
        <MetricCard
          label="Route limits"
          value={valueOrLoading(summary?.routeLimitCount, isLoading)}
          icon={Route}
        />
        <MetricCard
          label="Requests"
          value={valueOrLoading(summary?.totalRequests, isLoading)}
          icon={Activity}
        />
        <MetricCard
          label="Blocked"
          value={valueOrLoading(summary?.blockedRequests, isLoading)}
          icon={ShieldCheck}
        />
        <MetricCard
          label="Open alerts"
          value={valueOrLoading(summary?.openAlertCount, isLoading)}
          icon={ShieldAlert}
        />
      </div>
    </div>
  );
};
