import React, { FormEvent, useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, RefreshCcw, Save, SlidersHorizontal, XCircle } from 'lucide-react';
import { api } from '../api/client';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { NumberField } from '../components/NumberField';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { GatewaySettingsDto, TestGatewayConnectionResponse } from '../types';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateTime } from '../utils/display';

const permissionMessage = 'You need Admin access to perform this action.';

interface GatewaySettingsForm {
  upstreamBaseUrl: string;
  healthCheckPath: string;
  timeoutMs: string;
}

const toFormState = (settings: GatewaySettingsDto): GatewaySettingsForm => ({
  upstreamBaseUrl: settings.upstreamBaseUrl ?? '',
  healthCheckPath: settings.healthCheckPath ?? '',
  timeoutMs: String(settings.timeoutMs ?? '')
});

export const GatewaySettingsPage: React.FC = () => {
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<GatewaySettingsDto | null>(null);
  const [formState, setFormState] = useState<GatewaySettingsForm>({
    upstreamBaseUrl: '',
    healthCheckPath: '',
    timeoutMs: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestGatewayConnectionResponse | null>(null);
  const writeTooltip = !canMutate ? 'Admin required' : undefined;

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGatewaySettings();
      setSettings(data);
      setFormState(toFormState(data));
      setLoadError(null);
      setSaveError(null);
      setTestError(null);
      setTestResult(null);
    } catch (error) {
      console.error('Failed to load gateway settings:', error);
      setLoadError(getApiErrorMessage(error, 'Gateway settings are unavailable right now.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateField = (field: keyof GatewaySettingsForm, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
    setTestError(null);
    setTestResult(null);
  };

  const buildConnectionTestPayload = () => {
    const timeoutMs = Number(formState.timeoutMs);

    if (!formState.upstreamBaseUrl.trim()) {
      throw new Error('Upstream base URL is required');
    }
    if (!formState.healthCheckPath.trim().startsWith('/')) {
      throw new Error('Health check path must start with /');
    }
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error('Timeout must be greater than zero');
    }
    if (timeoutMs > 60000) {
      throw new Error('Timeout must be 60000 ms or fewer');
    }

    return {
      upstreamBaseUrl: formState.upstreamBaseUrl.trim(),
      healthCheckPath: formState.healthCheckPath.trim(),
      timeoutMs
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canMutate) {
      showToast({ message: permissionMessage, type: 'error' });
      return;
    }

    const timeoutMs = Number(formState.timeoutMs);
    setIsSaving(true);
    setSaveError(null);

    try {
      const updated = await api.updateGatewaySettings({
        upstreamBaseUrl: formState.upstreamBaseUrl.trim(),
        healthCheckPath: formState.healthCheckPath.trim(),
        timeoutMs
      });
      setSettings(updated);
      setFormState(toFormState(updated));
      showToast({ message: 'Gateway settings saved.', type: 'success' });
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not save gateway settings.');
      setSaveError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!settings) return;
    setFormState(toFormState(settings));
    setSaveError(null);
    setTestError(null);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestError(null);
    setTestResult(null);

    try {
      const result = await api.testGatewayConnection(buildConnectionTestPayload());
      setTestResult(result);
      showToast({
        message: result.reachable ? 'Upstream is reachable.' : 'Upstream is unreachable.',
        type: result.reachable ? 'success' : 'warning'
      });
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not test gateway connection.');
      setTestError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Gateway settings"
        meta={loadError ? <span className="text-xs text-slate-500">{loadError}</span> : undefined}
      />

      {isLoading ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">Loading gateway settings...</div>
      ) : loadError ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="Gateway settings unavailable"
          description={loadError}
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="max-w-3xl">
          {saveError && (
            <div className="mb-5 flex items-start gap-3 border-y border-red-950/35 py-4 text-sm text-red-300/90">
              <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p>{saveError}</p>
            </div>
          )}

          <div className="grid gap-5 py-3">
            <label className="block text-sm text-slate-500">
              Upstream API URL
              <input
                value={formState.upstreamBaseUrl}
                onChange={(event) => updateField('upstreamBaseUrl', event.target.value)}
                className="mt-2 quiet-field"
                placeholder="http://backend-service:8081"
                disabled={!canMutate || isSaving || isTestingConnection}
                required
              />
            </label>

            <label className="block text-sm text-slate-500">
              Health check path
              <input
                value={formState.healthCheckPath}
                onChange={(event) => updateField('healthCheckPath', event.target.value)}
                className="mt-2 quiet-field"
                placeholder="/health"
                disabled={!canMutate || isSaving || isTestingConnection}
                required
              />
            </label>

            <label className="block text-sm text-slate-500">
              Request timeout in milliseconds
              <NumberField
                min={1}
                max={60000}
                value={formState.timeoutMs}
                onChange={(value) => updateField('timeoutMs', value)}
                disabled={!canMutate || isSaving || isTestingConnection}
                required
              />
            </label>
          </div>

          <section className="py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Connection test</p>
              </div>
              <SecondaryButton
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection || isSaving}
              >
                <Activity size={16} aria-hidden="true" />
                {isTestingConnection ? 'Testing...' : 'Test connection'}
              </SecondaryButton>
            </div>

            {(testResult || testError) && (
              <div className={`mt-4 flex items-start gap-3 border-y py-4 text-sm ${
                testResult?.reachable
                  ? 'border-emerald-950/30 text-emerald-200/90'
                  : 'border-red-950/35 text-red-300/90'
              }`}>
                {testResult?.reachable ? (
                  <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium">
                    {testResult?.reachable ? 'Connected' : 'Unreachable'}
                  </p>
                  {testResult ? (
                    <p className="mt-1 break-words text-slate-400">
                      {testResult.reachable
                        ? `${testResult.checkedUrl} responded with ${testResult.statusCode} in ${testResult.responseTimeMs}ms`
                        : [
                            testResult.message,
                            testResult.checkedUrl ? `Checked ${testResult.checkedUrl}` : null,
                            testResult.statusCode ? `Status ${testResult.statusCode}` : null
                          ].filter(Boolean).join(' · ')}
                    </p>
                  ) : (
                    <p className="mt-1 break-words text-slate-400">{testError}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          <dl className="grid gap-4 py-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-600">Last updated</dt>
              <dd className="mt-1 text-sm text-slate-300">{formatDateTime(settings?.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-600">Updated by</dt>
              <dd className="mt-1 text-sm text-slate-300">{settings?.updatedBy || 'System'}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {canMutate ? (
              <>
                <PrimaryButton
                  type="submit"
                  disabled={isSaving}
                  className="bg-transparent text-slate-100 hover:bg-slate-900/35"
                >
                  <Save size={16} aria-hidden="true" />
                  {isSaving ? 'Saving...' : 'Save settings'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={handleReset} disabled={isSaving || isTestingConnection}>
                  <RefreshCcw size={16} aria-hidden="true" />
                  Reset
                </SecondaryButton>
              </>
            ) : (
              <PrimaryButton
                type="button"
                disabled
                tooltip={writeTooltip}
                className="bg-transparent text-slate-500"
                onClick={() => showToast({ message: permissionMessage, type: 'error' })}
              >
                <Save size={16} aria-hidden="true" />
                Save settings
              </PrimaryButton>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
