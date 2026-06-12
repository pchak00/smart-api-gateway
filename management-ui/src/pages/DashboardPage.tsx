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
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, helper, icon: Icon }) => (
  <Panel className="p-5 transition-colors hover:bg-slate-900/45">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
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
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPlans: 0,
    totalRequests: 0,
    totalBlocked: 0,
    totalAlerts: 0,
  });
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const clients = await api.getClients();
        const plans = await api.getPlans();
        setStats({
          totalClients: clients.length,
          totalPlans: plans.length,
          totalRequests: demoAnalyticsData.reduce((a, b) => a + b.allowedRequests + b.blockedRequests, 0),
          totalBlocked: demoAnalyticsData.reduce((a, b) => a + b.blockedRequests, 0),
          totalAlerts: demoAbuseAlerts.length
        });
        setIsDemoData(true);
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats({
          totalClients: demoClientsList.length,
          totalPlans: demoPlansList.length,
          totalRequests: demoAnalyticsData.reduce((a, b) => a + b.allowedRequests + b.blockedRequests, 0),
          totalBlocked: demoAnalyticsData.reduce((a, b) => a + b.blockedRequests, 0),
          totalAlerts: demoAbuseAlerts.length
        });
        setIsDemoData(true);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Gateway clients, plans, and traffic signals in one focused operations view."
        meta={isDemoData && (
          <div className="flex flex-wrap items-center gap-3">
            <DemoBadge />
            <span className="text-xs text-slate-500">
              Using seeded gateway data until live analytics is connected.
            </span>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Clients"
          value={stats.totalClients}
          helper="Gateway consumers."
          icon={Users}
        />
        <MetricCard
          label="Plans"
          value={stats.totalPlans}
          helper="Quota tiers."
          icon={CreditCard}
        />
        <MetricCard
          label="Requests"
          value={stats.totalRequests.toLocaleString()}
          helper="Seeded activity."
          icon={Activity}
        />
        <MetricCard
          label="Blocked"
          value={stats.totalBlocked.toLocaleString()}
          helper="Rejected requests."
          icon={ShieldCheck}
        />
        <MetricCard
          label="Alerts"
          value={stats.totalAlerts}
          helper="Demo abuse signal."
          icon={ShieldAlert}
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
