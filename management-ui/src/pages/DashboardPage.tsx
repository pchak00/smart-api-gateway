import React, { useEffect, useState } from 'react';
import { Activity, CreditCard, Gauge, Route, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client';
import { demoAnalyticsData } from '../utils/demoData';
import { useAuth } from '../hooks/useAuth';
import { DemoBadge, PageHeader, Panel } from '../components/PageShell';
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

const previewRequests = demoAnalyticsData.reduce((a, b) => a + b.allowedRequests + b.blockedRequests, 0);
const previewBlocked = demoAnalyticsData.reduce((a, b) => a + b.blockedRequests, 0);

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();
  const roleLabel = getRoleLabel(role);
  const [stats, setStats] = useState({
    totalClients: null as number | null,
    totalPlans: null as number | null,
    totalRouteLimits: null as number | null,
    totalRequests: previewRequests,
    totalBlocked: previewBlocked,
    totalAlerts: null as number | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [liveSources, setLiveSources] = useState({
    clients: false,
    plans: false,
    routeLimits: false,
    alerts: false
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const [clientsResult, plansResult, routeLimitsResult, alertsResult] = await Promise.allSettled([
        api.getClients(),
        api.getPlans(),
        api.getRouteLimits(),
        api.getGlobalAbuseAlerts()
      ]);

      const clientsLive = clientsResult.status === 'fulfilled';
      const plansLive = plansResult.status === 'fulfilled';
      const routeLimitsLive = routeLimitsResult.status === 'fulfilled';
      const alertsLive = alertsResult.status === 'fulfilled';

      setStats({
        totalClients: clientsLive ? clientsResult.value.length : null,
        totalPlans: plansLive ? plansResult.value.length : null,
        totalRouteLimits: routeLimitsLive ? routeLimitsResult.value.length : null,
        totalRequests: previewRequests,
        totalBlocked: previewBlocked,
        totalAlerts: alertsLive ? alertsResult.value.length : null
      });
      setLiveSources({
        clients: clientsLive,
        plans: plansLive,
        routeLimits: routeLimitsLive,
        alerts: alertsLive
      });
      setErrorMessage(
        clientsLive && plansLive && routeLimitsLive && alertsLive
          ? null
          : 'Some backend summaries are unavailable right now.'
      );
      setIsLoading(false);
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
            <DemoBadge>{Object.values(liveSources).some(Boolean) ? 'Live admin summaries' : 'Dashboard preview'}</DemoBadge>
            <span className="text-xs text-slate-500">
              {isLoading
                ? 'Loading backend summaries...'
                : errorMessage ?? 'Client, plan, route-limit, and alert counts use backend read APIs; request analytics remain preview data.'}
            </span>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Clients"
          value={isLoading ? '...' : stats.totalClients ?? '...'}
          helper={liveSources.clients ? 'Gateway consumers from /admin/clients.' : 'Backend client summary unavailable.'}
          icon={Users}
          source={liveSources.clients ? 'Live' : 'Unavailable'}
        />
        <MetricCard
          label="Plans"
          value={isLoading ? '...' : stats.totalPlans ?? '...'}
          helper={liveSources.plans ? 'Quota tiers from /admin/plans.' : 'Backend plan summary unavailable.'}
          icon={CreditCard}
          source={liveSources.plans ? 'Live' : 'Unavailable'}
        />
        <MetricCard
          label="Route limits"
          value={isLoading ? '...' : stats.totalRouteLimits ?? '...'}
          helper={liveSources.routeLimits ? 'Route overrides from /admin/route-limits.' : 'Backend route-limit summary unavailable.'}
          icon={Route}
          source={liveSources.routeLimits ? 'Live' : 'Unavailable'}
        />
        <MetricCard
          label="Requests"
          value={stats.totalRequests.toLocaleString()}
          helper="Seeded activity."
          icon={Activity}
          source="Preview"
        />
        <MetricCard
          label="Blocked"
          value={stats.totalBlocked.toLocaleString()}
          helper="Rejected requests."
          icon={ShieldCheck}
          source="Preview"
        />
        <MetricCard
          label="Alerts"
          value={isLoading ? '...' : stats.totalAlerts ?? '...'}
          helper={liveSources.alerts ? 'Global abuse alerts returned by the backend.' : 'Backend alert summary unavailable.'}
          icon={ShieldAlert}
          source={liveSources.alerts ? 'Live' : 'Unavailable'}
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
