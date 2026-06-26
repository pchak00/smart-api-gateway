import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Route, Search, Users, X } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api/client';
import { ClientAnalyticsDto, RouteAnalyticsDto, RouteTrafficAnalyticsDto, TrafficAnalyticsDto } from '../types';
import { EmptyState, PageHeader, Panel } from '../components/PageShell';
import { formatBucket, formatNumber } from '../utils/display';
import { useToast } from '../hooks/useToast';

type RouteTrendMetric = 'totalRequests' | 'allowedRequests' | 'blockedRequests';
type RouteTrendDisplayMode = 'top5' | 'top10' | 'custom';

type RouteTrendChartPoint = {
  bucketLabel: string;
  [key: string]: string | number;
};

type RouteTrendRouteTotals = {
  route: string;
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
};

type RouteTrendRoute = {
  key: string;
  route: string;
  color: string;
  strokeDasharray?: string;
  strokeWidth: number;
  opacity: number;
};

const safeCount = (value: number | null | undefined) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

const getRouteName = (route: string | null | undefined) => {
  const routeName = route?.trim();
  return routeName || 'Unknown route';
};

const routeTrendMetricOptions: Array<{ key: RouteTrendMetric; label: string }> = [
  { key: 'totalRequests', label: 'Total' },
  { key: 'allowedRequests', label: 'Allowed' },
  { key: 'blockedRequests', label: 'Blocked' }
];

const routeTrendDisplayOptions: Array<{ key: RouteTrendDisplayMode; label: string }> = [
  { key: 'top5', label: 'Top 5' },
  { key: 'top10', label: 'Top 10' },
  { key: 'custom', label: 'Custom' }
];

const getTopRouteLimit = (mode: RouteTrendDisplayMode) => (
  mode === 'top10' ? 10 : 5
);

const routeTrendColors = [
  '#93c5fd',
  '#67e8f9',
  '#5eead4',
  '#818cf8',
  '#94a3b8',
  '#38bdf8',
  '#2dd4bf',
  '#60a5fa',
  '#a5b4fc',
  '#cbd5e1'
];

const routeTrendLineStyles: Array<Pick<RouteTrendRoute, 'strokeDasharray' | 'strokeWidth' | 'opacity'>> = [
  { strokeWidth: 2.6, opacity: 1 },
  { strokeWidth: 2.1, opacity: 0.95 },
  { strokeWidth: 2, strokeDasharray: '6 4', opacity: 0.9 },
  { strokeWidth: 2, strokeDasharray: '2 4', opacity: 0.88 },
  { strokeWidth: 2, opacity: 0.72 },
  { strokeWidth: 1.8, strokeDasharray: '10 5', opacity: 0.78 },
  { strokeWidth: 1.8, strokeDasharray: '4 5', opacity: 0.76 },
  { strokeWidth: 1.8, strokeDasharray: '1 5', opacity: 0.74 },
  { strokeWidth: 1.7, opacity: 0.7 },
  { strokeWidth: 1.7, strokeDasharray: '7 6', opacity: 0.68 }
];

const getRouteTrendStyle = (index: number) => routeTrendLineStyles[index % routeTrendLineStyles.length];

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useToast();
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [routeTrafficAnalytics, setRouteTrafficAnalytics] = useState<RouteTrafficAnalyticsDto[]>([]);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalyticsDto[]>([]);
  const [trafficAnalytics, setTrafficAnalytics] = useState<TrafficAnalyticsDto[]>([]);
  const [selectedRouteMetric, setSelectedRouteMetric] = useState<RouteTrendMetric>('totalRequests');
  const [routeTrendMode, setRouteTrendMode] = useState<RouteTrendDisplayMode>('top5');
  const [routeSearch, setRouteSearch] = useState('');
  const [selectedCustomRoutes, setSelectedCustomRoutes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [routes, routeTraffic, clients, traffic] = await Promise.all([
          api.getRouteAnalytics(),
          api.getRouteTrafficAnalytics(),
          api.getClientAnalytics(),
          api.getTrafficAnalytics()
        ]);

        setRouteAnalytics(Array.isArray(routes) ? routes : []);
        setRouteTrafficAnalytics(Array.isArray(routeTraffic) ? routeTraffic : []);
        setClientAnalytics(Array.isArray(clients) ? clients : []);
        setTrafficAnalytics(Array.isArray(traffic) ? traffic : []);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setRouteAnalytics([]);
        setRouteTrafficAnalytics([]);
        setClientAnalytics([]);
        setTrafficAnalytics([]);
        setErrorMessage('Backend analytics are unavailable right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const routeTrendRouteOptions = useMemo<RouteTrendRouteTotals[]>(() => {
    const totals = new Map<string, RouteTrendRouteTotals>();

    routeTrafficAnalytics.forEach((point) => {
      const route = getRouteName(point.route);
      const current = totals.get(route) ?? {
        route,
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0
      };

      totals.set(route, {
        route,
        totalRequests: current.totalRequests + safeCount(point.totalRequests),
        allowedRequests: current.allowedRequests + safeCount(point.allowedRequests),
        blockedRequests: current.blockedRequests + safeCount(point.blockedRequests)
      });
    });

    return [...totals.values()]
      .sort((first, second) => {
        const totalDifference = second.totalRequests - first.totalRequests;
        if (totalDifference !== 0) return totalDifference;

        return first.route.localeCompare(second.route);
      });
  }, [routeTrafficAnalytics]);

  const routeTrendRoutes = useMemo<RouteTrendRoute[]>(() => {
    const routeOptionByName = new Map(routeTrendRouteOptions.map((option) => [option.route, option]));
    const routeNames = routeTrendMode === 'custom'
      ? selectedCustomRoutes.filter((route) => routeOptionByName.has(route))
      : [...routeTrendRouteOptions]
          .sort((first, second) => {
            const selectedDifference = second[selectedRouteMetric] - first[selectedRouteMetric];
            if (selectedDifference !== 0) return selectedDifference;

            const totalDifference = second.totalRequests - first.totalRequests;
            if (totalDifference !== 0) return totalDifference;

            return first.route.localeCompare(second.route);
          })
          .slice(0, getTopRouteLimit(routeTrendMode))
          .map((option) => option.route);

    return routeNames.map((route, index) => ({
      key: `route_${index}`,
      route,
      color: routeTrendColors[index % routeTrendColors.length],
      ...getRouteTrendStyle(index)
    }));
  }, [routeTrendMode, routeTrendRouteOptions, selectedCustomRoutes, selectedRouteMetric]);

  const routeTrendRouteCount = routeTrendRouteOptions.length;

  const routeSearchResults = useMemo(() => {
    const query = routeSearch.trim().toLowerCase();
    if (!query) return routeTrendRouteOptions.slice(0, 6);

    return routeTrendRouteOptions
      .filter((option) => option.route.toLowerCase().includes(query))
      .slice(0, 6);
  }, [routeSearch, routeTrendRouteOptions]);

  const handleSelectCustomRoute = (route: string) => {
    if (selectedCustomRoutes.includes(route)) return;

    if (selectedCustomRoutes.length >= 5) {
      showToast({ message: 'Compare up to 5 routes at a time.', type: 'error' });
      return;
    }

    setSelectedCustomRoutes((routes) => [...routes, route]);
    setRouteSearch('');
  };

  const handleRemoveCustomRoute = (route: string) => {
    setSelectedCustomRoutes((routes) => routes.filter((selectedRoute) => selectedRoute !== route));
  };

  const routeTrendData = useMemo<RouteTrendChartPoint[]>(() => {
    const buckets = new Map<string, RouteTrendChartPoint>();
    const routeKeyByName = new Map(routeTrendRoutes.map((route) => [route.route, route.key]));

    routeTrafficAnalytics.forEach((point) => {
      const bucket = point.bucket ?? 'Unknown date';
      const route = getRouteName(point.route);
      const routeKey = routeKeyByName.get(route);

      if (!routeKey) return;

      const existing = buckets.get(bucket) ?? {
        bucket,
        bucketLabel: formatBucket(bucket)
      };

      existing[routeKey] = safeCount(typeof existing[routeKey] === 'number' ? existing[routeKey] : undefined) +
        safeCount(point[selectedRouteMetric]);
      buckets.set(bucket, existing);
    });

    return [...buckets.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([, point]) => {
        routeTrendRoutes.forEach((route) => {
          if (typeof point[route.key] !== 'number') {
            point[route.key] = 0;
          }
        });

        return point;
      });
  }, [routeTrafficAnalytics, routeTrendRoutes, selectedRouteMetric]);

  const totalRequests = trafficAnalytics.reduce((sum, point) => sum + safeCount(point.totalRequests), 0);
  const totalAllowed = trafficAnalytics.reduce((sum, point) => sum + safeCount(point.allowedRequests), 0);
  const totalBlocked = trafficAnalytics.reduce((sum, point) => sum + safeCount(point.blockedRequests), 0);

  return (
    <div>
      <PageHeader
        title="Analytics"
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_16rem]">
        <Panel className="p-5">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100">Route trends</h2>
              <p className="mt-1 text-sm text-slate-500">Traffic over time by gateway route.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-md border border-slate-800/70 bg-slate-950/40 p-1">
                {routeTrendMetricOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedRouteMetric(option.key)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      selectedRouteMetric === option.key
                        ? 'bg-slate-800/80 text-slate-100'
                        : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-md border border-slate-800/70 bg-slate-950/40 p-1">
                {routeTrendDisplayOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRouteTrendMode(option.key)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      routeTrendMode === option.key
                        ? 'bg-slate-800/80 text-slate-100'
                        : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <BarChart3 className="text-slate-600" size={20} aria-hidden="true" />
            </div>
          </div>

          {routeTrendMode === 'custom' && !isLoading && !errorMessage && routeTrendRouteCount > 0 && (
            <div className="mb-5 space-y-3">
              <div className="relative max-w-xl">
                <div className="flex items-center rounded-md border border-slate-800 bg-slate-950/75 px-3 transition-colors focus-within:border-slate-600">
                  <Search className="mr-2 shrink-0 text-slate-700" size={15} aria-hidden="true" />
                  <input
                    type="search"
                    value={routeSearch}
                    onChange={(event) => setRouteSearch(event.target.value)}
                    placeholder="Search routes..."
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-700"
                  />
                  {routeSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => setRouteSearch('')}
                      className="ml-2 shrink-0 text-xs font-medium text-slate-600 transition-colors hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {routeSearch.trim() && (
                  <div className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-md border border-slate-800/80 bg-slate-950/95 shadow-xl shadow-black/20">
                    {routeSearchResults.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">No routes match this search.</p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto py-1">
                        {routeSearchResults.map((option) => {
                          const isSelected = selectedCustomRoutes.includes(option.route);

                          return (
                            <button
                              key={option.route}
                              type="button"
                              onClick={() => handleSelectCustomRoute(option.route)}
                              className="flex w-full min-w-0 items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-900/70"
                            >
                              <span className="min-w-0 truncate font-mono text-xs text-slate-300" title={option.route}>
                                {option.route}
                              </span>
                              <span className="shrink-0 text-xs text-slate-600">
                                {isSelected ? 'Selected' : `${formatNumber(option.totalRequests)} total`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedCustomRoutes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCustomRoutes.map((route) => (
                    <span
                      key={route}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-950/65 px-2 py-1 text-xs text-slate-400 ring-1 ring-slate-800/70"
                    >
                      <span className="max-w-56 truncate font-mono" title={route}>{route}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomRoute(route)}
                        className="text-slate-600 transition-colors hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-700/40"
                        aria-label={`Remove ${route}`}
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedCustomRoutes([])}
                    className="text-xs font-medium text-slate-600 transition-colors hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex h-72 items-center justify-center text-sm text-slate-500">
              Loading route trends...
            </div>
          ) : errorMessage ? (
            <EmptyState
              icon={Route}
              title="Route trends unavailable"
              description={errorMessage}
            />
          ) : routeTrendRouteCount === 0 ? (
            <EmptyState
              icon={Route}
              title="No route trend data yet"
              description="Send requests through the gateway to populate this chart."
            />
          ) : routeTrendMode === 'custom' && routeTrendRoutes.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Select routes to compare"
              description="Search and select routes to compare trends."
            />
          ) : routeTrendData.length === 0 ? (
            <EmptyState
              icon={Route}
              title="No route trend data yet"
              description="Send requests through the gateway to populate this chart."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={routeTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeOpacity={0.55} vertical={false} />
                  <XAxis dataKey="bucketLabel" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      boxShadow: '0 18px 45px rgba(2, 6, 23, 0.32)',
                      color: '#e2e8f0'
                    }}
                    itemStyle={{ color: '#cbd5e1', fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}
                    labelFormatter={(label) => `Bucket: ${String(label)}`}
                    formatter={(value, name) => [
                      formatNumber(typeof value === 'number' ? value : Number(value)),
                      routeTrendRoutes.find((route) => route.route === name)?.route ?? String(name)
                    ]}
                  />
                  {routeTrendRoutes.map((route) => (
                    <Line
                      key={route.key}
                      type="monotone"
                      dataKey={route.key}
                      name={route.route}
                      stroke={route.color}
                      strokeDasharray={route.strokeDasharray}
                      strokeOpacity={route.opacity}
                      strokeWidth={route.strokeWidth}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!isLoading && !errorMessage && routeTrendRoutes.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-slate-600">
                {routeTrendMode === 'custom'
                  ? `Comparing ${routeTrendRoutes.length} ${routeTrendRoutes.length === 1 ? 'route' : 'routes'}`
                  : `Showing top ${Math.min(getTopRouteLimit(routeTrendMode), routeTrendRoutes.length)}${routeTrendRouteCount > routeTrendRoutes.length ? ` of ${routeTrendRouteCount}` : ''} routes`}
              </p>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
                {routeTrendRoutes.map((route) => (
                  <div key={route.key} className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
                    <svg className="h-2 w-5 shrink-0 overflow-visible" viewBox="0 0 20 8" aria-hidden="true">
                      <line
                        x1="1"
                        y1="4"
                        x2="19"
                        y2="4"
                        stroke={route.color}
                        strokeDasharray={route.strokeDasharray}
                        strokeLinecap="round"
                        strokeOpacity={route.opacity}
                        strokeWidth={route.strokeWidth}
                      />
                    </svg>
                    <span className="min-w-0 truncate font-mono" title={route.route}>{route.route}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Summary</h2>
            <Activity className="text-slate-600" size={18} aria-hidden="true" />
          </div>

          <div className="mt-5 divide-y divide-slate-800/35">
            <div className="pb-4">
              <p className="text-sm text-slate-400">Requests</p>
              <p className="mt-2 text-3xl font-semibold text-slate-50">{isLoading ? '...' : formatNumber(totalRequests)}</p>
            </div>
            <div className="py-4">
              <p className="text-sm text-slate-400">Allowed</p>
              <p className="mt-2 text-3xl font-semibold text-slate-50">{isLoading ? '...' : formatNumber(totalAllowed)}</p>
            </div>
            <div className="py-4">
              <p className="text-sm text-slate-400">Blocked</p>
              <p className="mt-2 text-3xl font-semibold text-slate-50">{isLoading ? '...' : formatNumber(totalBlocked)}</p>
            </div>
            <p className="pt-4 text-xs leading-5 text-slate-500">
              {errorMessage ?? 'All-time totals from daily traffic buckets.'}
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Routes</h2>
              <p className="mt-1 text-sm text-slate-500">Usage grouped by gateway path.</p>
            </div>
            <Route className="text-slate-600" size={18} aria-hidden="true" />
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Loading route analytics...</div>
          ) : errorMessage ? (
            <EmptyState icon={Route} title="Route analytics unavailable" description={errorMessage} />
          ) : routeAnalytics.length === 0 ? (
            <EmptyState
              icon={Route}
              title="No route traffic recorded yet"
              description="Send requests through the gateway to populate route analytics."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="border-b border-slate-800/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Route</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Allowed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Blocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/35">
                  {routeAnalytics.map((route, index) => (
                    <tr key={route.route ?? index} className="transition-colors hover:bg-slate-900/35">
                      <td className="px-4 py-4 font-mono text-xs text-slate-300">{route.route ?? 'Unknown route'}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-300">{formatNumber(route.totalRequests)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-400">{formatNumber(route.allowedRequests)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-400">{formatNumber(route.blockedRequests)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Clients</h2>
              <p className="mt-1 text-sm text-slate-500">Usage grouped by API consumer.</p>
            </div>
            <Users className="text-slate-600" size={18} aria-hidden="true" />
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Loading client analytics...</div>
          ) : errorMessage ? (
            <EmptyState icon={Users} title="Client analytics unavailable" description={errorMessage} />
          ) : clientAnalytics.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No client analytics recorded yet"
              description="Client usage will appear here after gateway requests are logged."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="border-b border-slate-800/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Client</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Allowed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Blocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/35">
                  {clientAnalytics.map((client, index) => (
                    <tr key={client.clientId ?? index} className="transition-colors hover:bg-slate-900/35">
                      <td className="px-4 py-4 text-sm font-medium text-slate-100">
                        {client.clientName || `Client #${client.clientId ?? index + 1}`}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-300">{formatNumber(client.totalRequests)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-400">{formatNumber(client.allowedRequests)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-400">{formatNumber(client.blockedRequests)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
