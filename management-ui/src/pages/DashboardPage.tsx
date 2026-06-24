import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CreditCard, KeyRound, Route, ShieldAlert, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api/client';
import { AbuseAlertDto, DashboardSummaryDto, RouteAnalyticsDto, TrafficAnalyticsDto } from '../types';
import { PageHeader } from '../components/PageShell';
import { formatBucket, formatDateTime, formatNumber, getStatusLabel } from '../utils/display';
import { useAuth } from '../hooks/useAuth';

type TrafficChartPoint = TrafficAnalyticsDto & {
  bucketLabel: string;
};

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
}

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  action?: React.ReactNode;
}

interface StateMessageProps {
  children: React.ReactNode;
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

const DashboardSection: React.FC<DashboardSectionProps> = ({ children, className = '', title, action }) => (
  <section className={`rounded-lg bg-slate-900/20 p-5 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const StateMessage: React.FC<StateMessageProps> = ({ children }) => (
  <div className="flex min-h-40 items-center justify-center px-4 py-8 text-center text-sm text-slate-500">
    {children}
  </div>
);

const safeCount = (value: number | null | undefined) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

const valueOrLoading = (value: number | null | undefined, isLoading: boolean) => {
  if (isLoading) return '...';
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Unavailable';

  return formatNumber(value);
};

const topRoutes = (routes: RouteAnalyticsDto[]) => (
  [...routes]
    .sort((first, second) => safeCount(second.totalRequests) - safeCount(first.totalRequests))
    .slice(0, 5)
);

export const DashboardPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [trafficAnalytics, setTrafficAnalytics] = useState<TrafficAnalyticsDto[]>([]);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [openAlerts, setOpenAlerts] = useState<AbuseAlertDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationalLoading, setIsOperationalLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

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

  useEffect(() => {
    const loadOperationalSections = async () => {
      setIsOperationalLoading(true);

      const [trafficResult, routeResult, alertResult] = await Promise.allSettled([
        api.getTrafficAnalytics(),
        api.getRouteAnalytics(),
        api.getAbuseAlerts({ status: 'OPEN' })
      ]);

      if (trafficResult.status === 'fulfilled') {
        setTrafficAnalytics(Array.isArray(trafficResult.value) ? trafficResult.value : []);
        setTrafficError(null);
      } else {
        console.error('Failed to load traffic analytics:', trafficResult.reason);
        setTrafficAnalytics([]);
        setTrafficError('Traffic analytics are unavailable right now.');
      }

      if (routeResult.status === 'fulfilled') {
        setRouteAnalytics(Array.isArray(routeResult.value) ? routeResult.value : []);
        setRouteError(null);
      } else {
        console.error('Failed to load route analytics:', routeResult.reason);
        setRouteAnalytics([]);
        setRouteError('Route analytics are unavailable right now.');
      }

      if (alertResult.status === 'fulfilled') {
        setOpenAlerts(Array.isArray(alertResult.value) ? alertResult.value : []);
        setAlertError(null);
      } else {
        console.error('Failed to load open abuse alerts:', alertResult.reason);
        setOpenAlerts([]);
        setAlertError('Open alerts are unavailable right now.');
      }

      setIsOperationalLoading(false);
    };

    loadOperationalSections();
  }, []);

  const chartData = useMemo<TrafficChartPoint[]>(() => (
    trafficAnalytics.map((point) => ({
      bucket: point.bucket,
      bucketLabel: formatBucket(point.bucket),
      totalRequests: safeCount(point.totalRequests),
      allowedRequests: safeCount(point.allowedRequests),
      blockedRequests: safeCount(point.blockedRequests)
    }))
  ), [trafficAnalytics]);

  const visibleRoutes = useMemo(() => topRoutes(routeAnalytics), [routeAnalytics]);
  const visibleAlerts = openAlerts.slice(0, 3);
  const quickLinks = canMutate
    ? [
        { label: 'Manage clients', to: '/clients', icon: Users },
        { label: 'Route limits', to: '/route-limits', icon: Route },
        { label: 'Gateway settings', to: '/settings/gateway', icon: SlidersHorizontal },
        { label: 'Provisioning', to: '/settings/provisioning', icon: KeyRound }
      ]
    : [
        { label: 'View clients', to: '/clients', icon: Users },
        { label: 'View analytics', to: '/analytics', icon: Activity },
        { label: 'View abuse alerts', to: '/abuse-alerts', icon: ShieldAlert },
        { label: 'Gateway settings', to: '/settings/gateway', icon: SlidersHorizontal }
      ];

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

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <DashboardSection title="Traffic overview">
          {isOperationalLoading ? (
            <StateMessage>Loading traffic analytics...</StateMessage>
          ) : trafficError ? (
            <StateMessage>{trafficError}</StateMessage>
          ) : chartData.length === 0 ? (
            <StateMessage>No traffic recorded yet. Send requests through the gateway to populate analytics.</StateMessage>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardTotalRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashboardBlockedRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#475569" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeOpacity={0.42} vertical={false} />
                  <XAxis dataKey="bucketLabel" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      color: '#e2e8f0'
                    }}
                  />
                  <Area type="monotone" dataKey="totalRequests" name="Total" stroke="#94a3b8" fill="url(#dashboardTotalRequests)" strokeWidth={2} />
                  <Area type="monotone" dataKey="blockedRequests" name="Blocked" stroke="#64748b" fill="url(#dashboardBlockedRequests)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Alerts needing review"
          action={
            <Link to="/abuse-alerts" className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300">
              View all
            </Link>
          }
        >
          {isOperationalLoading ? (
            <StateMessage>Loading open alerts...</StateMessage>
          ) : alertError ? (
            <StateMessage>{alertError}</StateMessage>
          ) : visibleAlerts.length === 0 ? (
            <StateMessage>No open alerts. Blocked traffic that crosses abuse thresholds will appear here.</StateMessage>
          ) : (
            <div className="divide-y divide-slate-800/35">
              {visibleAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  to="/abuse-alerts"
                  className="block py-3 transition-colors hover:bg-slate-900/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {alert.clientName ?? `Client #${alert.clientId}`}
                    </p>
                    <span className="text-xs text-amber-300/80">{getStatusLabel(alert.status)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{formatNumber(alert.blockedCount ?? alert.blockedRequestCount)} blocked</span>
                    <span>{formatDateTime(alert.createdAt ?? alert.alertedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.75fr)]">
        <DashboardSection title="Top routes">
          {isOperationalLoading ? (
            <StateMessage>Loading route analytics...</StateMessage>
          ) : routeError ? (
            <StateMessage>{routeError}</StateMessage>
          ) : visibleRoutes.length === 0 ? (
            <StateMessage>No route activity yet.</StateMessage>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="border-b border-slate-800/35">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Route</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Total</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Blocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {visibleRoutes.map((route, index) => (
                    <tr key={route.route ?? index} className="transition-colors hover:bg-slate-900/30">
                      <td className="px-3 py-3 font-mono text-xs text-slate-300">{route.route ?? 'Unknown route'}</td>
                      <td className="px-3 py-3 text-right text-sm text-slate-300">{formatNumber(route.totalRequests)}</td>
                      <td className="px-3 py-3 text-right text-sm text-slate-400">{formatNumber(route.blockedRequests)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardSection>

        <DashboardSection title={canMutate ? 'Quick actions' : 'Quick links'}>
          <div className="grid gap-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-900/45 hover:text-slate-100"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="text-slate-600" size={16} aria-hidden="true" />
                    {link.label}
                  </span>
                  <ArrowRight className="text-slate-700" size={15} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
};
