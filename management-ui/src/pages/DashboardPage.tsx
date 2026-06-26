import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  Plus,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import { api } from '../api/client';
import { AbuseAlertDto, DashboardSummaryDto, GatewaySettingsDto, RouteAnalyticsDto } from '../types';
import { PageHeader } from '../components/PageShell';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, formatNumber, getStatusLabel } from '../utils/display';

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  action?: React.ReactNode;
}

interface StateMessageProps {
  children: React.ReactNode;
}

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

const safePositiveCount = (value: number | null | undefined) => Math.max(safeCount(value), 0);

const valueOrLoading = (value: number | null | undefined, isLoading: boolean) => {
  if (isLoading) return '...';
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Unavailable';

  return formatNumber(value);
};

const GatewaySummaryStrip: React.FC<{ summary: DashboardSummaryDto | null; isLoading: boolean }> = ({
  summary,
  isLoading
}) => {
  const metrics = [
    { label: 'Clients', value: valueOrLoading(summary?.clientCount, isLoading) },
    { label: 'Plans', value: valueOrLoading(summary?.planCount, isLoading) },
    { label: 'Route limits', value: valueOrLoading(summary?.routeLimitCount, isLoading) },
    { label: 'Requests', value: valueOrLoading(summary?.totalRequests, isLoading) },
    { label: 'Blocked', value: valueOrLoading(summary?.blockedRequests, isLoading) },
    { label: 'Open alerts', value: valueOrLoading(summary?.openAlertCount, isLoading) }
  ];

  return (
    <section className="rounded-lg bg-slate-900/25 px-5 py-5">
      <h2 className="text-sm font-semibold text-slate-100">Gateway summary</h2>
      <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <dt className="truncate text-xs font-medium text-slate-500">{metric.label}</dt>
            <dd className="mt-2 truncate text-2xl font-semibold leading-none text-slate-50">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const percentOrLoading = (summary: DashboardSummaryDto | null, isLoading: boolean) => {
  if (isLoading) return '...';
  if (!summary) return 'Unavailable';

  const totalRequests = safeCount(summary.totalRequests);
  const allowedRequests = safeCount(summary.allowedRequests);
  const blockedRequests = safeCount(summary.blockedRequests);
  const denominator = totalRequests > 0 ? totalRequests : allowedRequests + blockedRequests;

  if (denominator === 0) return '0%';

  return `${((blockedRequests / denominator) * 100).toFixed(1)}%`;
};

const topRoutes = (routes: RouteAnalyticsDto[]) => (
  [...routes]
    .filter((route) => safeCount(route.totalRequests) > 0)
    .sort((first, second) => safeCount(second.totalRequests) - safeCount(first.totalRequests))
    .slice(0, 5)
);

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

interface GatewayHealthPanelProps {
  settings: GatewaySettingsDto | null;
  summary: DashboardSummaryDto | null;
  mostActiveRoute: RouteAnalyticsDto | null;
  isSummaryLoading: boolean;
  isOperationalLoading: boolean;
  settingsError: string | null;
}

interface TopRoutesPanelProps {
  routes: RouteAnalyticsDto[];
}

interface QuickAction {
  label: string;
  to: string;
  icon: React.ElementType;
}

const healthValueClass = 'mt-1 min-w-0 truncate text-sm font-medium text-slate-100';

const GatewayHealthPanel: React.FC<GatewayHealthPanelProps> = ({
  settings,
  summary,
  mostActiveRoute,
  isSummaryLoading,
  isOperationalLoading,
  settingsError
}) => {
  const allowedRequests = valueOrLoading(summary?.allowedRequests, isSummaryLoading);
  const blockedRequests = valueOrLoading(summary?.blockedRequests, isSummaryLoading);
  const upstreamValue = isOperationalLoading
    ? '...'
    : settingsError
      ? 'Unavailable'
      : settings?.upstreamBaseUrl || 'Not configured';
  const mostActiveRouteLabel = isOperationalLoading
    ? '...'
    : mostActiveRoute?.route || 'No route traffic yet';

  return (
    <DashboardSection
      title="Gateway health"
      action={
        <Link to="/settings/gateway" className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300">
          Settings
        </Link>
      }
    >
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-md bg-slate-950/30 px-4 py-3">
          <dt className="text-xs font-medium text-slate-600">Configured upstream</dt>
          <dd className={healthValueClass} title={upstreamValue}>{upstreamValue}</dd>
        </div>
        <div className="rounded-md bg-slate-950/30 px-4 py-3">
          <dt className="text-xs font-medium text-slate-600">Allowed / blocked</dt>
          <dd className={healthValueClass}>{allowedRequests} / {blockedRequests}</dd>
        </div>
        <div className="rounded-md bg-slate-950/30 px-4 py-3">
          <dt className="text-xs font-medium text-slate-600">Block rate</dt>
          <dd className={healthValueClass}>{percentOrLoading(summary, isSummaryLoading)}</dd>
        </div>
        <div className="min-w-0 rounded-md bg-slate-950/30 px-4 py-3">
          <dt className="text-xs font-medium text-slate-600">Most active route</dt>
          <dd className={healthValueClass} title={mostActiveRouteLabel}>{mostActiveRouteLabel}</dd>
        </div>
      </dl>

      {settingsError && (
        <p className="mt-4 text-xs text-slate-600">{settingsError}</p>
      )}
    </DashboardSection>
  );
};

const TopRoutesPanel: React.FC<TopRoutesPanelProps> = ({ routes }) => {
  const maxRequests = Math.max(...routes.map((route) => safeCount(route.totalRequests)), 1);

  return (
    <div className="space-y-3">
      {routes.map((route, index) => {
        const totalRequests = safePositiveCount(route.totalRequests);
        const blockedRequests = Math.min(safePositiveCount(route.blockedRequests), totalRequests);
        const allowedRequests = Math.min(
          typeof route.allowedRequests === 'number' && !Number.isNaN(route.allowedRequests)
            ? safePositiveCount(route.allowedRequests)
            : Math.max(totalRequests - blockedRequests, 0),
          totalRequests - blockedRequests
        );
        const totalWidth = clampPercent(Math.max((totalRequests / maxRequests) * 100, 4));
        const blockedWidth = totalRequests > 0 ? clampPercent((blockedRequests / totalRequests) * 100) : 0;
        const allowedWidth = totalRequests > 0 ? clampPercent((allowedRequests / totalRequests) * 100) : 0;
        const routeLabel = route.route ?? 'Unknown route';

        return (
          <div key={`${routeLabel}-${index}`} className="rounded-md bg-slate-950/25 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="min-w-0 truncate font-mono text-xs text-slate-300" title={routeLabel}>
                {routeLabel}
              </p>
              <p className="shrink-0 text-xs text-slate-500">
                <span className="text-slate-300">{formatNumber(totalRequests)}</span> total
                <span className="px-1.5 text-slate-700">·</span>
                <span>{formatNumber(blockedRequests)} blocked</span>
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-950/70">
              <div
                className="flex h-full overflow-hidden rounded-full"
                style={{ width: `${totalWidth}%` }}
                aria-hidden="true"
              >
                {allowedWidth > 0 && (
                  <div
                    className="h-full bg-slate-500/70"
                    style={{ width: `${allowedWidth}%` }}
                  />
                )}
                {blockedWidth > 0 && (
                  <div
                    className="h-full bg-cyan-500/45"
                    style={{ width: `${blockedWidth}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const quickActions: QuickAction[] = [
  { label: 'Create API client', to: '/clients', icon: Users },
  { label: 'Create route limit', to: '/route-limits', icon: Plus },
  { label: 'Create provisioning token', to: '/settings/provisioning', icon: KeyRound },
  { label: 'Open gateway settings', to: '/settings/gateway', icon: SlidersHorizontal }
];

export const DashboardPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [gatewaySettings, setGatewaySettings] = useState<GatewaySettingsDto | null>(null);
  const [openAlerts, setOpenAlerts] = useState<AbuseAlertDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationalLoading, setIsOperationalLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
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

      const [routeResult, alertResult, settingsResult] = await Promise.allSettled([
        api.getRouteAnalytics(),
        api.getAbuseAlerts({ status: 'OPEN' }),
        api.getGatewaySettings()
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

      if (settingsResult.status === 'fulfilled') {
        setGatewaySettings(settingsResult.value);
        setSettingsError(null);
      } else {
        console.error('Failed to load gateway settings:', settingsResult.reason);
        setGatewaySettings(null);
        setSettingsError('Gateway settings are unavailable right now.');
      }

      setIsOperationalLoading(false);
    };

    loadOperationalSections();
  }, []);

  const visibleRoutes = useMemo(() => topRoutes(routeAnalytics), [routeAnalytics]);
  const mostActiveRoute = visibleRoutes[0] ?? null;
  const visibleAlerts = openAlerts
    .filter((alert) => alert.status === 'OPEN')
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      <GatewaySummaryStrip summary={summary} isLoading={isLoading} />

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <GatewayHealthPanel
          settings={gatewaySettings}
          summary={summary}
          mostActiveRoute={mostActiveRoute}
          isSummaryLoading={isLoading}
          isOperationalLoading={isOperationalLoading}
          settingsError={settingsError}
        />

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

      <div className={`mt-4 grid grid-cols-1 gap-4 ${canMutate ? 'xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]' : ''}`}>
        <DashboardSection
          title="Top routes"
          action={
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 text-xs text-slate-600 sm:flex" aria-hidden="true">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-3 rounded-full bg-slate-500/70" />
                  Allowed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-3 rounded-full bg-cyan-500/45" />
                  Blocked
                </span>
              </div>
              <Link to="/analytics" className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300">
                View all routes
              </Link>
            </div>
          }
        >
          {isOperationalLoading ? (
            <StateMessage>Loading route analytics...</StateMessage>
          ) : routeError ? (
            <StateMessage>{routeError}</StateMessage>
          ) : visibleRoutes.length === 0 ? (
            <StateMessage>No route traffic recorded yet.</StateMessage>
          ) : (
            <TopRoutesPanel routes={visibleRoutes} />
          )}
        </DashboardSection>

        {canMutate && (
          <DashboardSection title="Quick actions">
            <div className="grid gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 rounded-md bg-slate-950/25 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-950/45 hover:text-slate-100"
                  >
                    <Icon size={16} aria-hidden="true" className="shrink-0 text-slate-600" />
                    <span>{action.label}</span>
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
