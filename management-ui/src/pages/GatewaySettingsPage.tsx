import React, { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, RefreshCcw, Save, SlidersHorizontal } from 'lucide-react';
import { api } from '../api/client';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { SettingsTabs } from '../components/SettingsTabs';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { GatewaySettingsDto } from '../types';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateTime } from '../utils/display';

const permissionMessage = 'You need SUPER_ADMIN access to perform this action.';

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const writeTooltip = !canMutate ? 'SUPER_ADMIN required' : undefined;

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGatewaySettings();
      setSettings(data);
      setFormState(toFormState(data));
      setLoadError(null);
      setSaveError(null);
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
  };

  return (
    <div>
      <SettingsTabs />

      <PageHeader
        title="Gateway settings"
        description="Configure runtime gateway settings for the upstream API, health checks, and request timeout."
        meta={
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Dynamic upstream routing will be wired in a future milestone. These settings are stored in the database and are ready for runtime configuration.
          </p>
        }
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

          <div className="grid gap-5 border-y border-slate-800/40 py-5">
            <label className="block text-sm text-slate-500">
              Upstream API URL
              <input
                value={formState.upstreamBaseUrl}
                onChange={(event) => updateField('upstreamBaseUrl', event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-slate-600 disabled:cursor-not-allowed disabled:text-slate-500"
                placeholder="http://backend-service:8081"
                disabled={!canMutate || isSaving}
                required
              />
            </label>

            <label className="block text-sm text-slate-500">
              Health check path
              <input
                value={formState.healthCheckPath}
                onChange={(event) => updateField('healthCheckPath', event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-slate-600 disabled:cursor-not-allowed disabled:text-slate-500"
                placeholder="/health"
                disabled={!canMutate || isSaving}
                required
              />
            </label>

            <label className="block text-sm text-slate-500">
              Request timeout in milliseconds
              <input
                type="number"
                min={1}
                max={60000}
                value={formState.timeoutMs}
                onChange={(event) => updateField('timeoutMs', event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-slate-600 disabled:cursor-not-allowed disabled:text-slate-500"
                disabled={!canMutate || isSaving}
                required
              />
            </label>
          </div>

          <dl className="grid gap-4 border-b border-slate-800/40 py-5 sm:grid-cols-2">
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
                <PrimaryButton type="submit" disabled={isSaving}>
                  <Save size={16} aria-hidden="true" />
                  {isSaving ? 'Saving...' : 'Save settings'}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={handleReset} disabled={isSaving}>
                  <RefreshCcw size={16} aria-hidden="true" />
                  Reset
                </SecondaryButton>
              </>
            ) : (
              <PrimaryButton
                type="button"
                disabled
                tooltip={writeTooltip}
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
