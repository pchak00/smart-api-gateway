import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CreditCard, KeyRound, Route, ShieldAlert, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import { api } from '../api/client';
import { AbuseAlertDto, DashboardSummaryDto, GatewaySettingsDto, RouteAnalyticsDto } from '../types';
import { PageHeader } from '../components/PageShell';
import { formatDateTime, formatNumber, getStatusLabel } from '../utils/display';
import { useAuth } from '../hooks/useAuth';
import pacificLogo from '../assets/pacific-logo.png';

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
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [openAlerts, setOpenAlerts] = useState<AbuseAlertDto[]>([]);
  const [gatewaySettings, setGatewaySettings] = useState<GatewaySettingsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationalLoading, setIsOperationalLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

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

      const [settingsResult, routeResult, alertResult] = await Promise.allSettled([
        api.getGatewaySettings(),
        api.getRouteAnalytics(),
        api.getAbuseAlerts({ status: 'OPEN' })
      ]);

      if (settingsResult.status === 'fulfilled') {
        setGatewaySettings(settingsResult.value);
        setSettingsError(null);
      } else {
        console.error('Failed to load gateway settings:', settingsResult.reason);
        setGatewaySettings(null);
        setSettingsError('Gateway settings are unavailable right now.');
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

  const visibleRoutes = useMemo(() => topRoutes(routeAnalytics), [routeAnalytics]);
  const visibleAlerts = openAlerts.slice(0, 3);
  const quickLinks = [
    { label: 'Create API client', to: '/clients', icon: Users },
    { label: 'Create route limit', to: '/route-limits', icon: Route },
    { label: 'Create provisioning token', to: '/settings/provisioning', icon: KeyRound },
    { label: 'Open gateway settings', to: '/settings/gateway', icon: SlidersHorizontal }
  ];
  const allowedRequests = safeCount(summary?.allowedRequests);
  const blockedRequests = safeCount(summary?.blockedRequests);
  const trafficProcessed = safeCount(summary?.totalRequests) || allowedRequests + blockedRequests;
  const mostActiveRoute = visibleRoutes[0]?.route;

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
        <DashboardSection
          title="Gateway flow"
          action={
            <Link to="/settings/gateway" className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300">
              Settings
            </Link>
          }
        >
          <div className="relative overflow-hidden rounded-lg bg-slate-950/25 p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(9rem,0.75fr)_minmax(11rem,1fr)_minmax(9rem,0.85fr)] lg:items-center">
              <div className="rounded-lg bg-slate-900/45 p-4">
                <p className="text-xs font-medium text-slate-500">API clients</p>
                <p className="mt-4 text-3xl font-semibold leading-none text-slate-50">
                  {valueOrLoading(summary?.clientCount, isLoading)}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-800" aria-hidden="true" />
                  <ArrowRight className="shrink-0 text-slate-700" size={15} aria-hidden="true" />
                  <span className="shrink-0 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-400">
                    {isLoading ? '...' : `${formatNumber(trafficProcessed)} requests`}
                  </span>
                  <ArrowRight className="shrink-0 text-slate-700" size={15} aria-hidden="true" />
                  <div className="h-px flex-1 bg-slate-800" aria-hidden="true" />
                </div>

                <div className="rounded-lg bg-slate-900/55 p-5 text-center ring-1 ring-slate-800/45">
                  <img
                    src={pacificLogo}
                    alt=""
                    className="mx-auto h-10 w-10 rounded-md object-cover opacity-85"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-100">Pacific gateway</p>
                  <p className="mt-1 text-xs text-slate-500">Policy enforcement</p>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                  <div />
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-px bg-slate-800" aria-hidden="true" />
                    <div className="rounded-lg bg-slate-950/70 px-4 py-3 text-center">
                      <p className="text-xs font-medium text-slate-500">Blocked by policy</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">
                        {isLoading ? '...' : formatNumber(blockedRequests)}
                      </p>
                    </div>
                  </div>
                  <div />
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/45 p-4">
                <p className="text-xs font-medium text-slate-500">Upstream API</p>
                <p className="mt-4 text-3xl font-semibold leading-none text-slate-50">
                  {isLoading ? '...' : formatNumber(allowedRequests)}
                </p>
                <p className="mt-2 text-xs text-slate-500">allowed</p>
                <p className="mt-4 truncate font-mono text-xs text-slate-400" title={gatewaySettings?.upstreamBaseUrl}>
                  {isOperationalLoading
                    ? '...'
                    : settingsError ?? gatewaySettings?.upstreamBaseUrl ?? 'Not configured'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-slate-800/35 pt-4 text-xs sm:grid-cols-2">
              <div className="min-w-0">
                <span className="text-slate-600">Most active route</span>
                <p className="mt-1 truncate font-mono text-slate-300" title={mostActiveRoute}>
                  {isOperationalLoading ? '...' : mostActiveRoute ?? 'No route activity yet'}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Open alerts</span>
                <p className="mt-1 text-slate-300">{valueOrLoading(summary?.openAlertCount, isLoading)}</p>
              </div>
            </div>
          </div>
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
                You're all caught up.
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

      <div className={`mt-4 grid grid-cols-1 gap-4 ${canMutate ? 'xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.75fr)]' : ''}`}>
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

        {canMutate && (
          <DashboardSection title="Quick actions">
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
        )}
      </div>
    </div>
  );
};
