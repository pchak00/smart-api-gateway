import React, { useEffect, useState } from 'react';
import { Activity, CreditCard, Gauge, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client';
import { demoAbuseAlerts, demoAnalyticsData, demoClientsList, demoPlansList } from '../utils/demoData';
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

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();
  const roleLabel = getRoleLabel(role);
  const previewRequests = demoAnalyticsData.reduce((a, b) => a + b.allowedRequests + b.blockedRequests, 0);
  const previewBlocked = demoAnalyticsData.reduce((a, b) => a + b.blockedRequests, 0);
  const [stats, setStats] = useState({
    totalClients: demoClientsList.length,
    totalPlans: demoPlansList.length,
    totalRequests: previewRequests,
    totalBlocked: previewBlocked,
    totalAlerts: demoAbuseAlerts.length,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isClientCountLive, setIsClientCountLive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const clients = await api.getClients();
        setStats({
          totalClients: clients.length,
          totalPlans: demoPlansList.length,
          totalRequests: previewRequests,
          totalBlocked: previewBlocked,
          totalAlerts: demoAbuseAlerts.length
        });
        setIsClientCountLive(true);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats({
          totalClients: demoClientsList.length,
          totalPlans: demoPlansList.length,
          totalRequests: previewRequests,
          totalBlocked: previewBlocked,
          totalAlerts: demoAbuseAlerts.length
        });
        setIsClientCountLive(false);
        setErrorMessage('Backend clients are unavailable right now; seeded preview values remain visible.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [previewBlocked, previewRequests]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Gateway clients, plans, and traffic signals in one focused operations view."
        meta={(
          <div className="flex flex-wrap items-center gap-3">
            <DemoBadge>{isClientCountLive ? 'Partial live data' : 'Demo dashboard preview'}</DemoBadge>
            <span className="text-xs text-slate-500">
              {isLoading
                ? 'Loading backend client count...'
                : errorMessage ?? 'Client count is live; analytics, plan, and alert summaries remain preview data until backend read endpoints exist.'}
            </span>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Clients"
          value={isLoading ? '...' : stats.totalClients}
          helper={isClientCountLive ? 'Gateway consumers from /admin/clients.' : 'Seeded fallback clients.'}
          icon={Users}
          source={isClientCountLive ? 'Live' : 'Preview'}
        />
        <MetricCard
          label="Plans"
          value={stats.totalPlans}
          helper="Quota tiers."
          icon={CreditCard}
          source="Preview"
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
          value={stats.totalAlerts}
          helper="Demo abuse signal."
          icon={ShieldAlert}
          source="Preview"
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
