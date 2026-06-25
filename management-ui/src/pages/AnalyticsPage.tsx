import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Route, Users } from 'lucide-react';
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

type RouteTrendMetric = 'totalRequests' | 'allowedRequests' | 'blockedRequests';

type RouteTrendChartPoint = {
  bucketLabel: string;
  [key: string]: string | number;
};

const safeCount = (value: number | null | undefined) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

const routeTrendMetricOptions: Array<{ key: RouteTrendMetric; label: string }> = [
  { key: 'totalRequests', label: 'Total' },
  { key: 'allowedRequests', label: 'Allowed' },
  { key: 'blockedRequests', label: 'Blocked' }
];

const routeTrendColors = ['#94a3b8', '#67e8f9', '#60a5fa', '#5eead4', '#818cf8'];

export const AnalyticsPage: React.FC = () => {
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [routeTrafficAnalytics, setRouteTrafficAnalytics] = useState<RouteTrafficAnalyticsDto[]>([]);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalyticsDto[]>([]);
  const [trafficAnalytics, setTrafficAnalytics] = useState<TrafficAnalyticsDto[]>([]);
  const [selectedRouteMetric, setSelectedRouteMetric] = useState<RouteTrendMetric>('totalRequests');
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

  const routeTrendRoutes = useMemo(() => {
    const totals = new Map<string, number>();

    routeTrafficAnalytics.forEach((point) => {
      const route = point.route ?? 'Unknown route';
      totals.set(route, (totals.get(route) ?? 0) + safeCount(point.totalRequests));
    });

    return [...totals.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5)
      .map(([route], index) => ({
        key: `route_${index}`,
        route,
        color: routeTrendColors[index % routeTrendColors.length]
      }));
  }, [routeTrafficAnalytics]);

  const routeTrendData = useMemo<RouteTrendChartPoint[]>(() => {
    const buckets = new Map<string, RouteTrendChartPoint>();
    const routeKeyByName = new Map(routeTrendRoutes.map((route) => [route.route, route.key]));

    routeTrafficAnalytics.forEach((point) => {
      const bucket = point.bucket ?? 'Unknown date';
      const route = point.route ?? 'Unknown route';
      const routeKey = routeKeyByName.get(route);

      if (!routeKey) return;

      const existing = buckets.get(bucket) ?? {
        bucket,
        bucketLabel: formatBucket(bucket)
      };

      existing[routeKey] = safeCount(point[selectedRouteMetric]);
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
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Route trends</h2>
              <p className="mt-1 text-sm text-slate-500">Traffic over time by gateway route.</p>
            </div>
            <div className="flex items-center gap-3">
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
              <BarChart3 className="text-slate-600" size={20} aria-hidden="true" />
            </div>
          </div>

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
          ) : routeTrendData.length === 0 || routeTrendRoutes.length === 0 ? (
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
                      color: '#e2e8f0'
                    }}
                    formatter={(value, name) => [
                      formatNumber(typeof value === 'number' ? value : Number(value)),
                      routeTrendRoutes.find((route) => route.key === name)?.route ?? name
                    ]}
                  />
                  {routeTrendRoutes.map((route) => (
                    <Line
                      key={route.key}
                      type="monotone"
                      dataKey={route.key}
                      name={route.key}
                      stroke={route.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!isLoading && !errorMessage && routeTrendRoutes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {routeTrendRoutes.map((route) => (
                <div key={route.key} className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
                  <span className="h-1.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: route.color }} />
                  <span className="max-w-48 truncate font-mono" title={route.route}>{route.route}</span>
                </div>
              ))}
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
