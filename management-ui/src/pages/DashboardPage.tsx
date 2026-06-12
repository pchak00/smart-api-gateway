import React, { useEffect, useState } from 'react';
import { Activity, CreditCard, Gauge, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client';
import { demoAnalyticsData, demoClientsList, demoPlansList } from '../utils/demoData';
import { useAuth } from '../hooks/useAuth';
import { DemoBadge, PageHeader, Panel } from '../components/PageShell';

interface MetricCardProps {
  label: string;
  value: number | string;
  helper: string;
  icon: React.ElementType;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, helper, icon: Icon }) => (
  <Panel className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">{value}</p>
      </div>
      <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-2.5 text-blue-200">
        <Icon size={19} aria-hidden="true" />
      </div>
    </div>
    <p className="mt-4 text-xs leading-5 text-slate-500">{helper}</p>
  </Panel>
);

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPlans: 0,
    totalRequests: 0,
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
          totalRequests: demoAnalyticsData.reduce((a, b) => a + b.allowedRequests + b.blockedRequests, 0)
        });
        setIsDemoData(true);
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats({
          totalClients: demoClientsList.length,
          totalPlans: demoPlansList.length,
          totalRequests: demoAnalyticsData.reduce((a, b) => a + b.allowedRequests + b.blockedRequests, 0)
        });
        setIsDemoData(true);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Operations overview"
        title="Dashboard"
        description="A compact view of gateway clients, plans, traffic preview, and current admin access."
        meta={isDemoData && (
          <div className="flex flex-wrap items-center gap-3">
            <DemoBadge />
            <span className="text-xs text-slate-500">
              Using seeded gateway data until live analytics is connected.
            </span>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Clients"
          value={stats.totalClients}
          helper="Known gateway consumers in the current management view."
          icon={Users}
        />
        <MetricCard
          label="Plans"
          value={stats.totalPlans}
          helper="Quota tiers available to API consumers."
          icon={CreditCard}
        />
        <MetricCard
          label="Preview requests"
          value={stats.totalRequests.toLocaleString()}
          helper="Seeded request activity used as a dashboard placeholder."
          icon={Activity}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-blue-200">
              <Gauge size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Gateway posture</h2>
              <p className="mt-1 text-sm text-slate-500">
                Rate limits, usage logging, and abuse alerts remain the primary operating surfaces for this UI.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-cyan-200">
              <ShieldCheck size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Signed in as {role}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Role-based navigation and restricted actions are enforced in the dashboard shell.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};
