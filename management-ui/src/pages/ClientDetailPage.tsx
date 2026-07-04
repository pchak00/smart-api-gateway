import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, KeyRound, Power, RotateCw, Server, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { EmptyState, PageHeader, Panel } from '../components/PageShell';
import { AbuseAlertDto, AbuseAlertStatus, ClientApiKeyRotationResponse, ClientDto, ClientStatsDto, UsageLogDto } from '../types';
import { formatDateTime, formatNumber, getPlanLabel, getStatusLabel } from '../utils/display';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { SensitiveValue } from '../components/SensitiveValue';
import {
  ClientApiKeyLifecycleDialogs,
  PendingClientLifecycleAction
} from '../components/ClientApiKeyLifecycleDialogs';

const alertStatusClass = (status: AbuseAlertStatus | string | null | undefined) => {
  if (status === 'RESOLVED') return 'bg-slate-900/40 text-slate-400';
  if (status === 'ACKNOWLEDGED') return 'bg-sky-950/25 text-sky-300/80';
  return 'bg-amber-950/25 text-amber-300/85';
};

const getAlertTimeline = (alert: AbuseAlertDto) => {
  if (alert.status === 'RESOLVED') return formatDateTime(alert.resolvedAt ?? alert.lastStatusChangedAt ?? alert.lastUpdatedAt);
  if (alert.status === 'ACKNOWLEDGED') return formatDateTime(alert.acknowledgedAt ?? alert.lastStatusChangedAt ?? alert.lastUpdatedAt);

  return formatDateTime(alert.createdAt ?? alert.alertedAt);
};

const getAlertUrl = (alert: AbuseAlertDto) => {
  const params = new URLSearchParams();
  params.set('status', (alert.status ?? 'OPEN').toLowerCase());
  params.set('clientId', String(alert.clientId));
  if (alert.id) params.set('alertId', String(alert.id));

  return `/abuse-alerts?${params.toString()}`;
};

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams();
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const clientId = Number(id);
  const hasClientId = Boolean(id && Number.isInteger(clientId) && clientId > 0);
  const [stats, setStats] = useState<ClientStatsDto | null>(null);
  const [usageLogs, setUsageLogs] = useState<UsageLogDto[]>([]);
  const [abuseAlerts, setAbuseAlerts] = useState<AbuseAlertDto[]>([]);
  const [client, setClient] = useState<ClientDto | null>(null);
  const [isLoading, setIsLoading] = useState(hasClientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState<PendingClientLifecycleAction | null>(null);
  const [rotatedKey, setRotatedKey] = useState<ClientApiKeyRotationResponse | null>(null);
  const [isApiKeyRevealed, setIsApiKeyRevealed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    hasClientId ? null : 'A backend client id is required to load live client activity.'
  );

  const loadClientActivity = useCallback(async () => {
    if (!hasClientId) {
      setStats(null);
      setUsageLogs([]);
      setAbuseAlerts([]);
      setClient(null);
      setErrorMessage('A backend client id is required to load live client activity.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [clientsResult, statsResult, usageResult, abuseResult] = await Promise.allSettled([
      api.getClients(),
      api.getClientStats(clientId),
      api.getUsageLogs(clientId),
      api.getClientAbuseAlerts(clientId)
    ]);

    if (clientsResult.status === 'fulfilled') {
      setClient(clientsResult.value.find((candidate) => candidate.id === clientId) ?? null);
    } else {
      console.error('Failed to load client identity:', clientsResult.reason);
      setClient(null);
    }

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value);
    } else {
      console.error('Failed to load client stats:', statsResult.reason);
      setStats(null);
    }

    if (usageResult.status === 'fulfilled') {
      setUsageLogs(usageResult.value);
    } else {
      console.error('Failed to load client usage:', usageResult.reason);
      setUsageLogs([]);
    }

    if (abuseResult.status === 'fulfilled') {
      setAbuseAlerts(abuseResult.value);
    } else {
      console.error('Failed to load client abuse alerts:', abuseResult.reason);
      setAbuseAlerts([]);
    }

    const activityLoaded = statsResult.status === 'fulfilled' || usageResult.status === 'fulfilled' || abuseResult.status === 'fulfilled';
    setErrorMessage(activityLoaded ? null : 'Live client activity could not be loaded for this id.');
    setIsLoading(false);
  }, [clientId, hasClientId, id]);

  useEffect(() => {
    loadClientActivity();
  }, [loadClientActivity]);

  const handleConfirmRotateApiKey = async () => {
    if (!canMutate || pendingLifecycleAction?.kind !== 'rotate' || !pendingLifecycleAction.client.id) return;

    setIsSubmitting(true);
    try {
      const response = await api.rotateClientApiKey(pendingLifecycleAction.client.id);
      setPendingLifecycleAction(null);
      setRotatedKey(response);
      showToast({ message: 'API key rotated.', type: 'success' });
      await loadClientActivity();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not rotate API key.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDisableClient = async () => {
    if (!canMutate || pendingLifecycleAction?.kind !== 'disable' || !pendingLifecycleAction.client.id) return;

    setIsSubmitting(true);
    try {
      await api.disableClient(pendingLifecycleAction.client.id);
      setPendingLifecycleAction(null);
      showToast({ message: 'Client disabled.', type: 'success' });
      await loadClientActivity();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not disable client.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnableClient = async () => {
    if (!canMutate || !client?.id) return;

    setIsSubmitting(true);
    try {
      await api.enableClient(client.id);
      showToast({ message: 'Client enabled.', type: 'success' });
      await loadClientActivity();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not enable client.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRotatedKey = async () => {
    if (!rotatedKey?.apiKey) return false;

    try {
      await navigator.clipboard.writeText(rotatedKey.apiKey);
      showToast({ message: 'Copied.', type: 'success' });
      return true;
    } catch {
      showToast({ message: 'Could not copy API key.', type: 'error' });
      return false;
    }
  };

  const actionButtons = canMutate && client?.id ? (
    <>
      <SecondaryButton
        type="button"
        disabled={isSubmitting}
        onClick={() => setPendingLifecycleAction({ kind: 'rotate', client })}
      >
        <RotateCw size={15} aria-hidden="true" />
        Rotate API key
      </SecondaryButton>
      {client.active ? (
        <SecondaryButton
          type="button"
          disabled={isSubmitting}
          onClick={() => setPendingLifecycleAction({ kind: 'disable', client })}
        >
          <Power size={15} aria-hidden="true" />
          Disable client
        </SecondaryButton>
      ) : (
        <PrimaryButton type="button" disabled={isSubmitting} onClick={handleEnableClient}>
          <Power size={15} aria-hidden="true" />
          Enable client
        </PrimaryButton>
      )}
    </>
  ) : undefined;

  return (
    <div className="min-w-0">
      <PageHeader
        title={client?.clientName ?? `Client ${id ?? ''}`.trim()}
        actions={actionButtons}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel className="p-4 sm:p-5 transition-colors hover:bg-slate-900/45">
          <div className="flex items-center gap-3">
            <Server className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Client identity</h2>
              <p className="mt-1 text-sm text-slate-400">
                {client
                  ? `${client.active ? 'Active' : 'Inactive'} on ${getPlanLabel(client.planName ?? client.plan?.planName)}`
                  : hasClientId
                    ? `Backend id ${clientId}`
                    : 'No backend id available.'}
              </p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4 sm:p-5 transition-colors hover:bg-slate-900/45">
          <div className="flex items-center gap-3">
            <KeyRound className="text-slate-600" size={18} aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100">API key</h2>
              <SensitiveValue
                value={client?.apiKey}
                revealed={isApiKeyRevealed}
                onRevealedChange={setIsApiKeyRevealed}
                copyMessage="API key copied"
                missingLabel="Not returned by the per-client activity endpoints."
                className="mt-1"
              />
            </div>
          </div>
        </Panel>
        <Panel className="p-4 sm:p-5 transition-colors hover:bg-slate-900/45">
          <div className="flex items-center gap-3">
            <Activity className="text-slate-600" size={18} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Usage</h2>
              <p className="mt-1 text-sm text-slate-500">
                {stats ? `${formatNumber(stats.totalRequests)} total requests` : 'Request and block history.'}
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
            <Panel className="p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Usage logs</h2>
                  <p className="mt-1 text-sm text-slate-400">
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
                <div className="max-h-[480px] overflow-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="sticky top-0 z-10 border-b border-slate-800/40 bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Path</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageLogs.map((log) => {
                        const allowed = log.allowed ?? log.isAllowed ?? false;

                        return (
                          <tr key={log.id} className="transition-colors hover:bg-slate-900/25">
                            <td className="px-4 py-4 font-mono text-sm text-slate-100">{log.path}</td>
                            <td className="px-4 py-4 text-sm text-slate-300">{log.method}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                allowed
                                  ? 'bg-emerald-950/30 text-emerald-300/90'
                                  : 'bg-slate-800/65 text-slate-200'
                              }`}>
                                {allowed ? 'Allowed' : 'Blocked'} {log.statusCode}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-300">{formatDateTime(log.timestamp)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel className="p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Recent alerts</h2>
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
                  {abuseAlerts.map((alert, index) => {
                    const blockedCount = alert.blockedCount ?? alert.blockedRequestCount ?? 0;

                    return (
                      <Link
                        key={`${alert.createdAt ?? 'alert'}-${index}`}
                        to={getAlertUrl(alert)}
                        aria-label={`View ${getStatusLabel(alert.status).toLowerCase()} alert with ${formatNumber(blockedCount)} blocked requests`}
                        className="block rounded-lg bg-slate-950/20 p-4 transition-colors hover:bg-slate-950/35 focus:outline-none focus:ring-2 focus:ring-slate-700/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-100">
                              {formatNumber(blockedCount)} blocked
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {alert.windowStart ? `Window started ${formatDateTime(alert.windowStart)}` : 'Window unavailable'}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${alertStatusClass(alert.status)}`}>
                            {getStatusLabel(alert.status)}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">{getAlertTimeline(alert)}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        )}
      </section>

      <ClientApiKeyLifecycleDialogs
        pendingAction={pendingLifecycleAction}
        rotatedKey={rotatedKey}
        isSubmitting={isSubmitting}
        onCancelPendingAction={() => setPendingLifecycleAction(null)}
        onConfirmRotate={handleConfirmRotateApiKey}
        onConfirmDisable={handleConfirmDisableClient}
        onCloseRotatedKey={() => setRotatedKey(null)}
        onCopyRotatedKey={handleCopyRotatedKey}
      />
    </div>
  );
};
