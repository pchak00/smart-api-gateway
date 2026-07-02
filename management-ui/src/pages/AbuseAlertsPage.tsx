import React, { useCallback, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { AbuseAlertDto, AbuseAlertStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { EmptyState, PageHeader } from '../components/PageShell';
import { RowActions } from '../components/RowActions';
import { formatDateTime, formatNumber, getStatusLabel } from '../utils/display';
import { getApiErrorMessage } from '../utils/apiError';

type AlertFilter = 'ALL' | AbuseAlertStatus;

const statusFilters: Array<{ label: string; value: AlertFilter }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Resolved', value: 'RESOLVED' }
];

const permissionMessage = 'You need Admin access to perform this action.';

const statusLabelClass = (status: AbuseAlertStatus | string | null | undefined) => {
  if (status === 'RESOLVED') return 'bg-slate-900/70 text-slate-400';
  if (status === 'ACKNOWLEDGED') return 'bg-sky-950/25 text-sky-300/80';
  return 'bg-rose-950/25 text-rose-300/85';
};

const getLifecycleLabel = (alert: AbuseAlertDto) => {
  if (alert.status === 'RESOLVED') {
    return `Resolved ${formatDateTime(alert.resolvedAt)}${alert.resolvedBy ? ` by ${alert.resolvedBy}` : ''}`;
  }

  if (alert.status === 'ACKNOWLEDGED') {
    return `Acknowledged ${formatDateTime(alert.acknowledgedAt)}${alert.acknowledgedBy ? ` by ${alert.acknowledgedBy}` : ''}`;
  }

  return `Created ${formatDateTime(alert.createdAt ?? alert.alertedAt)}`;
};

const getPrimaryTimeline = (alert: AbuseAlertDto) => {
  if (alert.status === 'RESOLVED') return formatDateTime(alert.resolvedAt ?? alert.lastStatusChangedAt ?? alert.lastUpdatedAt);
  if (alert.status === 'ACKNOWLEDGED') return formatDateTime(alert.acknowledgedAt ?? alert.lastStatusChangedAt ?? alert.lastUpdatedAt);

  return formatDateTime(alert.createdAt ?? alert.alertedAt);
};

const getWindowLabel = (alert: AbuseAlertDto) => (
  alert.windowStart ? `Window started ${formatDateTime(alert.windowStart)}` : 'Abuse window unavailable'
);

const getEmptyCopy = (filter: AlertFilter) => {
  if (filter === 'OPEN') {
    return 'No open alerts. Blocked traffic that crosses abuse thresholds will appear here.';
  }

  if (filter === 'ACKNOWLEDGED') {
    return 'No acknowledged alerts are waiting for resolution.';
  }

  if (filter === 'RESOLVED') {
    return 'No resolved alerts to show yet.';
  }

  return 'Alerts will appear here when the gateway detects repeated blocked traffic.';
};

export const AbuseAlertsPage: React.FC = () => {
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<AbuseAlertDto[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AlertFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionAlertId, setActionAlertId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAlerts = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await api.getAbuseAlerts(
        selectedStatus === 'ALL' ? undefined : { status: selectedStatus }
      );
      setAlerts(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load abuse alerts:', error);
      setAlerts([]);
      setErrorMessage('Backend abuse alerts are unavailable right now.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleLifecycleAction = async (alert: AbuseAlertDto, action: 'acknowledge' | 'resolve') => {
    if (!canMutate) {
      showToast({ message: permissionMessage, type: 'error' });
      return;
    }

    if (!alert.id) return;

    setActionAlertId(alert.id);
    try {
      if (action === 'acknowledge') {
        await api.acknowledgeAbuseAlert(alert.id);
        showToast({ message: 'Alert acknowledged.', type: 'success' });
      } else {
        await api.resolveAbuseAlert(alert.id);
        showToast({ message: 'Alert resolved.', type: 'success' });
      }

      await loadAlerts(false);
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, `Could not ${action} alert.`),
        type: 'error'
      });
    } finally {
      setActionAlertId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Abuse Alerts"
        description="Review clients that repeatedly exceeded rate limits or triggered suspicious gateway behavior."
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
        actions={
          <div className="flex rounded-md border border-slate-800/70 bg-slate-950/40 p-1">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSelectedStatus(filter.value)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedStatus === filter.value
                    ? 'bg-slate-800/80 text-slate-100'
                    : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      />

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading abuse alerts...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={ShieldAlert}
            title="Abuse alerts unavailable"
            description={errorMessage}
          />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={selectedStatus === 'ALL' ? 'No abuse alerts' : `No ${getStatusLabel(selectedStatus).toLowerCase()} alerts`}
            description={getEmptyCopy(selectedStatus)}
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Blocked</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Timeline</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Lifecycle actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35">
                {alerts.map((alert, index) => {
                  const status = alert.status ?? 'OPEN';
                  const blockedCount = alert.blockedCount ?? alert.blockedRequestCount ?? 0;
                  const isOpen = status === 'OPEN';
                  const alertContext = alert.message || 'Blocked request threshold reached.';
                  const actions = canMutate && status !== 'RESOLVED'
                    ? [
                        {
                          label: 'Resolve',
                          disabled: actionAlertId === alert.id,
                          onClick: () => handleLifecycleAction(alert, 'resolve')
                        }
                      ]
                    : [];

                  return (
                    <tr key={alert.id ?? index} className="transition-colors hover:bg-slate-900/35">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-100">
                          {alert.clientName ?? `Client #${alert.clientId ?? index + 1}`}
                        </p>
                        <p className="mt-1 max-w-md truncate text-xs text-slate-400" title={alertContext}>
                          {alert.severity ? `${alert.severity} · ` : ''}{alertContext}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusLabelClass(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className={`text-sm font-medium ${isOpen ? 'text-rose-200/80' : 'text-slate-300'}`}>
                          {formatNumber(blockedCount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{getWindowLabel(alert)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-300">{getPrimaryTimeline(alert)}</p>
                        <p className="mt-1 text-xs text-slate-400">{getLifecycleLabel(alert)}</p>
                      </td>
                      <td className="px-4 py-4 text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          {isOpen && (
                            <button
                              type="button"
                              disabled={!canMutate || actionAlertId === alert.id}
                              title={!canMutate ? 'Admin required' : undefined}
                              onClick={() => handleLifecycleAction(alert, 'acknowledge')}
                              className="rounded-md bg-slate-900/55 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/35 disabled:cursor-not-allowed disabled:text-slate-600 disabled:opacity-60"
                            >
                              Acknowledge
                            </button>
                          )}
                          {actions.length > 0 ? (
                            <RowActions actions={actions} label="Alert lifecycle actions" />
                          ) : (
                            <span className="text-xs text-slate-600">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
