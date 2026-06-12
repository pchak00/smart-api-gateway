import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { demoAbuseAlerts } from '../utils/demoData';
import { DemoBadge, EmptyState, PageHeader, Panel } from '../components/PageShell';

export const AbuseAlertsPage: React.FC = () => (
  <div>
    <PageHeader
      title="Abuse Alerts"
      description="Review clients that repeatedly exceeded rate limits or triggered suspicious gateway behavior."
      meta={<DemoBadge>Demo alert preview</DemoBadge>}
    />

    <Panel className="overflow-hidden">
      {demoAbuseAlerts.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No abuse alerts"
          description="Alerts will appear here when the gateway detects repeated blocked traffic."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-950/35">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Client</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Blocked</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Severity</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {demoAbuseAlerts.map((alert, index) => (
                <tr key={alert.id ?? index} className="hover:bg-slate-900">
                  <td className="px-5 py-4 text-sm font-medium text-slate-100">
                    {alert.clientName ?? `Client #${alert.clientId ?? index + 1}`}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {alert.blockedRequestCount ?? alert.blockedCount ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-amber-950/50 px-2.5 py-1 text-xs font-medium text-amber-300">
                      {alert.severity ?? 'Watch'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {alert.lastUpdatedAt ?? alert.createdAt ?? alert.alertedAt ?? 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  </div>
);
