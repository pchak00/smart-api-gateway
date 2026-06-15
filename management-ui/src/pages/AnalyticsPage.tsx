import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Route, Users } from 'lucide-react';
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
import { ClientAnalyticsDto, RouteAnalyticsDto, TrafficAnalyticsDto } from '../types';
import { DemoBadge, EmptyState, PageHeader, Panel } from '../components/PageShell';
import { formatBucket, formatNumber } from '../utils/display';

type TrafficChartPoint = TrafficAnalyticsDto & {
  bucketLabel: string;
};

const safeCount = (value: number | null | undefined) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

export const AnalyticsPage: React.FC = () => {
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalyticsDto[]>([]);
  const [trafficAnalytics, setTrafficAnalytics] = useState<TrafficAnalyticsDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [routes, clients, traffic] = await Promise.all([
          api.getRouteAnalytics(),
          api.getClientAnalytics(),
          api.getTrafficAnalytics()
        ]);

        setRouteAnalytics(Array.isArray(routes) ? routes : []);
        setClientAnalytics(Array.isArray(clients) ? clients : []);
        setTrafficAnalytics(Array.isArray(traffic) ? traffic : []);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setRouteAnalytics([]);
        setClientAnalytics([]);
        setTrafficAnalytics([]);
        setErrorMessage('Backend analytics are unavailable right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
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

  const totalRequests = trafficAnalytics.reduce((sum, point) => sum + safeCount(point.totalRequests), 0);
  const totalAllowed = trafficAnalytics.reduce((sum, point) => sum + safeCount(point.allowedRequests), 0);
  const totalBlocked = trafficAnalytics.reduce((sum, point) => sum + safeCount(point.blockedRequests), 0);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Request trends, route usage, and client traffic from persisted gateway usage logs."
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <DemoBadge>{errorMessage ? 'Analytics unavailable' : 'Live analytics'}</DemoBadge>
            <span className="text-xs text-slate-500">
              {isLoading
                ? 'Loading gateway analytics...'
                : errorMessage ?? 'Route, client, and traffic sections use backend analytics endpoints.'}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_16rem]">
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Request trend</h2>
              <p className="mt-1 text-sm text-slate-500">Daily totals from persisted usage logs.</p>
            </div>
            <BarChart3 className="text-slate-600" size={20} aria-hidden="true" />
          </div>

          {isLoading ? (
            <div className="flex h-72 items-center justify-center text-sm text-slate-500">
              Loading traffic analytics...
            </div>
          ) : errorMessage ? (
            <EmptyState
              icon={Activity}
              title="Traffic unavailable"
              description={errorMessage}
            />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No traffic recorded yet"
              description="Send requests through the gateway to populate analytics."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="allowedRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#475569" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="blockedRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#334155" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#334155" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                  />
                  <Area type="monotone" dataKey="totalRequests" name="Total" stroke="#94a3b8" fill="url(#totalRequests)" strokeWidth={2} />
                  <Area type="monotone" dataKey="allowedRequests" name="Allowed" stroke="#64748b" fill="url(#allowedRequests)" strokeWidth={2} />
                  <Area type="monotone" dataKey="blockedRequests" name="Blocked" stroke="#475569" fill="url(#blockedRequests)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
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
