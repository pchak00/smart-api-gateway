import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { demoAbuseAlerts } from '../utils/demoData';
import { DemoBadge, EmptyState, PageHeader } from '../components/PageShell';

export const AbuseAlertsPage: React.FC = () => (
  <div>
    <PageHeader
      title="Abuse Alerts"
      description="Review clients that repeatedly exceeded rate limits or triggered suspicious gateway behavior."
      meta={<DemoBadge>Demo alert preview</DemoBadge>}
    />

    <section>
      {demoAbuseAlerts.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No abuse alerts"
          description="Alerts will appear here when the gateway detects repeated blocked traffic."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-800/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Blocked</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/35">
              {demoAbuseAlerts.map((alert, index) => (
                <tr key={alert.id ?? index} className="transition-colors hover:bg-slate-900/35">
                  <td className="px-4 py-4 text-sm font-medium text-slate-100">
                    {alert.clientName ?? `Client #${alert.clientId ?? index + 1}`}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {alert.blockedRequestCount ?? alert.blockedCount ?? 0}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-amber-950/30 px-2 py-0.5 text-xs font-medium text-amber-300/90">
                      {alert.severity ?? 'Watch'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {alert.lastUpdatedAt ?? alert.createdAt ?? alert.alertedAt ?? 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </div>
);
