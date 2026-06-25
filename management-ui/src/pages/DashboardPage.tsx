import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CreditCard, Route, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client';
import { AbuseAlertDto, DashboardSummaryDto, RouteAnalyticsDto } from '../types';
import { PageHeader } from '../components/PageShell';
import { formatDateTime, formatNumber, getStatusLabel } from '../utils/display';

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
    .filter((route) => safeCount(route.totalRequests) > 0)
    .sort((first, second) => safeCount(second.totalRequests) - safeCount(first.totalRequests))
    .slice(0, 5)
);

interface RouteActivityGraphProps {
  routes: RouteAnalyticsDto[];
}

const RouteActivityGraph: React.FC<RouteActivityGraphProps> = ({ routes }) => {
  const maxRequests = Math.max(...routes.map((route) => safeCount(route.totalRequests)), 1);

  return (
    <div className="space-y-4">
      {routes.map((route, index) => {
        const totalRequests = safeCount(route.totalRequests);
        const blockedRequests = safeCount(route.blockedRequests);
        const totalWidth = Math.max((totalRequests / maxRequests) * 100, 3);
        const blockedWidth = totalRequests > 0 ? Math.min((blockedRequests / totalRequests) * 100, 100) : 0;
        const routeLabel = route.route ?? 'Unknown route';

        return (
          <div key={`${routeLabel}-${index}`} className="grid gap-2 lg:grid-cols-[minmax(9rem,14rem)_1fr_auto] lg:items-center">
            <p className="truncate font-mono text-xs text-slate-300" title={routeLabel}>
              {routeLabel}
            </p>

            <div className="h-3 overflow-hidden rounded-full bg-slate-950/70">
              <div
                className="relative h-full rounded-full bg-slate-600/70"
                style={{ width: `${totalWidth}%` }}
                aria-hidden="true"
              >
                {blockedRequests > 0 && (
                  <div
                    className="absolute right-0 top-0 h-full rounded-full bg-slate-800/85"
                    style={{ width: `${blockedWidth}%` }}
                  />
                )}
              </div>
            </div>

            <p className="whitespace-nowrap text-xs text-slate-500">
              <span className="text-slate-300">{formatNumber(totalRequests)}</span> total
              <span className="px-1.5 text-slate-700">/</span>
              <span>{formatNumber(blockedRequests)} blocked</span>
            </p>
          </div>
        );
      })}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [openAlerts, setOpenAlerts] = useState<AbuseAlertDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationalLoading, setIsOperationalLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

      const [routeResult, alertResult] = await Promise.allSettled([
        api.getRouteAnalytics(),
        api.getAbuseAlerts({ status: 'OPEN' })
      ]);

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

  const visibleRoutes = useMemo(() => topRoutes(routeAnalytics), [routeAnalytics]);
  const visibleAlerts = openAlerts
    .filter((alert) => !alert.status || alert.status === 'OPEN')
    .slice(0, 3);

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
        <DashboardSection title="Route activity">
          {isOperationalLoading ? (
            <StateMessage>Loading route analytics...</StateMessage>
          ) : routeError ? (
            <StateMessage>{routeError}</StateMessage>
          ) : visibleRoutes.length === 0 ? (
            <StateMessage>No route activity yet. Send requests through the gateway to populate this view.</StateMessage>
          ) : (
            <RouteActivityGraph routes={visibleRoutes} />
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
            <StateMessage>
              <span>
                No open alerts.
                <br />
                You’re all caught up.
              </span>
            </StateMessage>
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
    </div>
  );
};
