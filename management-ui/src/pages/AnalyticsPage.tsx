import React from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { demoAnalyticsData } from '../utils/demoData';
import { DemoBadge, PageHeader, Panel } from '../components/PageShell';

const totalAllowed = demoAnalyticsData.reduce((sum, point) => sum + point.allowedRequests, 0);
const totalBlocked = demoAnalyticsData.reduce((sum, point) => sum + point.blockedRequests, 0);

export const AnalyticsPage: React.FC = () => (
  <div>
    <PageHeader
      title="Analytics"
      description="Preview request trends and blocked traffic patterns for the gateway operations dashboard."
      meta={<DemoBadge>Demo analytics preview</DemoBadge>}
    />

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_16rem]">
      <Panel className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Request trend</h2>
            <p className="mt-1 text-sm text-slate-500">Seeded activity until live analytics is connected.</p>
          </div>
          <BarChart3 className="text-slate-600" size={20} aria-hidden="true" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoAnalyticsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="allowedRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#475569" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#475569" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="blockedRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#334155" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#334155" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeOpacity={0.55} vertical={false} />
              <XAxis dataKey="timestamp" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  color: '#e2e8f0'
                }}
              />
              <Area type="monotone" dataKey="allowedRequests" stroke="#64748b" fill="url(#allowedRequests)" strokeWidth={2} />
              <Area type="monotone" dataKey="blockedRequests" stroke="#475569" fill="url(#blockedRequests)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Summary</h2>
          <Activity className="text-slate-600" size={18} aria-hidden="true" />
        </div>

        <div className="mt-5 divide-y divide-slate-800/35">
          <div className="pb-4">
            <p className="text-sm text-slate-400">Requests</p>
            <p className="mt-2 text-3xl font-semibold text-slate-50">{totalAllowed.toLocaleString()}</p>
          </div>
          <div className="py-4">
            <p className="text-sm text-slate-400">Blocked</p>
            <p className="mt-2 text-3xl font-semibold text-slate-50">{totalBlocked.toLocaleString()}</p>
          </div>
          <p className="pt-4 text-xs leading-5 text-slate-500">
            Using seeded gateway data until live analytics is connected.
          </p>
        </div>
      </Panel>
    </div>
  </div>
);
