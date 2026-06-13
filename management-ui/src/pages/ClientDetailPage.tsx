import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, KeyRound, Server, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { EmptyState, PageHeader, Panel } from '../components/PageShell';
import { AbuseAlertDto, ClientStatsDto, UsageLogDto } from '../types';
import { formatDateTime, getSeverityLabel } from '../utils/display';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams();
  const clientId = Number(id);
  const hasClientId = Boolean(id && Number.isInteger(clientId) && clientId > 0);
  const [stats, setStats] = useState<ClientStatsDto | null>(null);
  const [usageLogs, setUsageLogs] = useState<UsageLogDto[]>([]);
  const [abuseAlerts, setAbuseAlerts] = useState<AbuseAlertDto[]>([]);
  const [isLoading, setIsLoading] = useState(hasClientId);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    hasClientId ? null : 'A backend client id is required to load live client activity.'
  );

  useEffect(() => {
    if (!hasClientId) {
      setStats(null);
      setUsageLogs([]);
      setAbuseAlerts([]);
      setErrorMessage('A backend client id is required to load live client activity.');
      setIsLoading(false);
      return;
    }

    const loadClientActivity = async () => {
      setIsLoading(true);
      try {
        const [statsResponse, usageResponse, abuseResponse] = await Promise.all([
          api.getClientStats(clientId),
          api.getUsageLogs(clientId),
          api.getAbuseAlerts(clientId)
        ]);
        setStats(statsResponse);
        setUsageLogs(usageResponse);
        setAbuseAlerts(abuseResponse);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load client activity:', error);
        setStats(null);
        setUsageLogs([]);
        setAbuseAlerts([]);
        setErrorMessage('Live client activity could not be loaded for this id.');
      } finally {
        setIsLoading(false);
      }
    };

    loadClientActivity();
  }, [clientId, hasClientId]);

  return (
    <div>
      <PageHeader
        title={`Client ${id ?? ''}`.trim()}
        description="Inspect the live per-client activity endpoints that exist today; identity fields need a backend detail contract."
        meta={
          <span className="text-xs text-slate-500">
            {hasClientId
              ? 'Using /stats, /usage, and /abuse for this client id.'
              : 'Open a client URL with a numeric backend id to load live activity.'}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel className="p-5 transition-colors hover:bg-slate-900/45">
          <div className="flex items-center gap-3">
            <Server className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Client identity</h2>
              <p className="mt-1 text-sm text-slate-500">
                {hasClientId ? `Backend id ${clientId}` : 'No backend id available.'}
              </p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5 transition-colors hover:bg-slate-900/45">
          <div className="flex items-center gap-3">
            <KeyRound className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">API key</h2>
              <p className="mt-1 text-sm text-slate-500">Not exposed by the current detail endpoints.</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-5 transition-colors hover:bg-slate-900/45">
          <div className="flex items-center gap-3">
            <Activity className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Usage</h2>
              <p className="mt-1 text-sm text-slate-500">
                {stats ? `${stats.totalRequests.toLocaleString()} total requests` : 'Request and block history.'}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <section className="mt-5">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading client activity...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={Activity}
            title="Client activity unavailable"
            description={errorMessage}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.75fr]">
            <Panel className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Usage logs</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {stats
                      ? `${stats.allowedRequests ?? 0} allowed, ${stats.blockedRequests} blocked.`
                      : 'Recent gateway requests.'}
                  </p>
                </div>
                <Activity className="text-slate-600" size={18} aria-hidden="true" />
              </div>

              {usageLogs.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No usage logs"
                  description="Requests for this client will appear here after gateway traffic is recorded."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="border-b border-slate-800/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Path</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/35">
                      {usageLogs.map((log) => {
                        const allowed = log.allowed ?? log.isAllowed ?? false;

                        return (
                          <tr key={log.id} className="transition-colors hover:bg-slate-900/35">
                            <td className="px-4 py-4 font-mono text-sm text-slate-100">{log.path}</td>
                            <td className="px-4 py-4 text-sm text-slate-300">{log.method}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                allowed
                                  ? 'bg-emerald-950/30 text-emerald-300/90'
                                  : 'bg-amber-950/30 text-amber-300/90'
                              }`}>
                                {allowed ? 'Allowed' : 'Blocked'} {log.statusCode}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-400">{formatDateTime(log.timestamp)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Abuse signals</h2>
                  <p className="mt-1 text-sm text-slate-500">Alerts returned for this client.</p>
                </div>
                <ShieldAlert className="text-slate-600" size={18} aria-hidden="true" />
              </div>

              {abuseAlerts.length === 0 ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="No abuse alerts"
                  description="Alerts will appear here after repeated blocked traffic is detected."
                />
              ) : (
                <div className="space-y-3">
                  {abuseAlerts.map((alert, index) => (
                    <div key={`${alert.createdAt ?? 'alert'}-${index}`} className="rounded-lg bg-slate-950/35 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-100">
                          {getSeverityLabel(alert.severity)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(alert.createdAt ?? alert.alertedAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{alert.message ?? 'Blocked request threshold reached.'}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {(alert.blockedCount ?? alert.blockedRequestCount ?? 0).toLocaleString()} blocked requests
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </section>
    </div>
  );
};
