import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clipboard, KeyRound, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { EmptyState, PageHeader } from '../components/PageShell';
import { IconButton, PrimaryButton, SecondaryButton } from '../components/Button';
import { RowActions } from '../components/RowActions';
import { AppDropdown, DropdownOption } from '../components/AppDropdown';
import { InfoTooltip } from '../components/InfoTooltip';
import { PlanDto, ProvisioningTokenDto } from '../types';
import { formatDateTime, getPlanLabel } from '../utils/display';
import { getApiErrorMessage } from '../utils/apiError';

interface OneTimeToken {
  name: string;
  token: string;
}

export const ProvisioningPage: React.FC = () => {
  const { canMutate } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const createActionRequested = searchParams.get('action') === 'create';
  const [tokens, setTokens] = useState<ProvisioningTokenDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [defaultPlanName, setDefaultPlanName] = useState('');
  const [oneTimeToken, setOneTimeToken] = useState<OneTimeToken | null>(null);
  const writeTooltip = !canMutate ? 'Admin required' : undefined;

  const loadProvisioningTokens = async () => {
    try {
      const data = await api.getProvisioningTokens();
      setTokens(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load provisioning tokens:', error);
      setTokens([]);
      setErrorMessage('Backend provisioning tokens are unavailable right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProvisioningTokens();
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await api.getPlans();
        setPlans(data);
        if (!defaultPlanName && data[0]?.planName) {
          setDefaultPlanName(data[0].planName);
        }
      } catch (error) {
        console.error('Failed to load plans for provisioning token actions:', error);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    if (!defaultPlanName && plans[0]?.planName) {
      setDefaultPlanName(plans[0].planName);
    }
  }, [defaultPlanName, plans]);

  const resetForm = () => {
    setTokenName('');
    setDefaultPlanName(plans[0]?.planName ?? '');
  };

  const handleCreateToken = async (event: FormEvent) => {
    event.preventDefault();

    if (!canMutate) {
      showToast({ message: 'You need Admin access to perform this action.', type: 'error' });
      return;
    }

    if (!defaultPlanName) return;

    setIsSubmitting(true);
    try {
      const created = await api.createProvisioningToken({
        name: tokenName.trim(),
        defaultPlanName
      });
      setOneTimeToken({
        name: created.name,
        token: created.token
      });
      showToast({ message: 'Provisioning token created.', type: 'success' });
      resetForm();
      setIsCreateOpen(false);
      await loadProvisioningTokens();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not create provisioning token.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = async () => {
    if (!oneTimeToken) return;

    try {
      await navigator.clipboard.writeText(oneTimeToken.token);
      showToast({ message: 'Provisioning token copied.', type: 'success' });
    } catch (error) {
      console.error('Failed to copy provisioning token:', error);
      showToast({ message: 'Could not copy token.', type: 'error' });
    }
  };

  const handleDisableToken = async (token: ProvisioningTokenDto) => {
    if (!canMutate) {
      showToast({ message: 'You need Admin access to perform this action.', type: 'error' });
      return;
    }

    if (!window.confirm(`Disable provisioning token ${token.name}?`)) return;

    setIsSubmitting(true);
    try {
      await api.disableProvisioningToken(token.id);
      showToast({ message: 'Provisioning token disabled.', type: 'success' });
      await loadProvisioningTokens();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not disable provisioning token.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeOneTimeToken = () => {
    setOneTimeToken(null);
  };
  const planOptions = useMemo<DropdownOption[]>(() => (
    plans.map((plan) => ({
      value: plan.planName,
      label: getPlanLabel(plan.planName)
    }))
  ), [plans]);

  useEffect(() => {
    if (!createActionRequested || !canMutate) return;
    resetForm();
    setIsCreateOpen(true);
  }, [canMutate, createActionRequested]);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Provisioning"
        titleAccessory={
          <>
            <InfoTooltip label="Provisioning token details">
              Provisioning tokens are trusted server-to-server credentials used to create API clients without using the browser UI. Use them from backend services only, not frontend code.
            </InfoTooltip>
            <IconButton
              type="button"
              disabled={!canMutate}
              tooltip={canMutate ? 'Create token' : writeTooltip ?? 'Admin required'}
              aria-label="Create token"
              onClick={() => {
                resetForm();
                setIsCreateOpen((open) => !open);
              }}
            >
              <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
            </IconButton>
          </>
        }
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      {isCreateOpen && (
        <form
          onSubmit={handleCreateToken}
          className="mb-8 grid max-w-5xl gap-4 py-2 lg:grid-cols-[minmax(16rem,1fr)_14rem_auto] lg:items-end"
        >
          <label className="block text-sm text-slate-500">
            Token name
            <input
              value={tokenName}
              onChange={(event) => setTokenName(event.target.value)}
              className="mt-2 quiet-field"
              required
            />
          </label>
          <div className="block text-sm text-slate-500">
            <span>Default plan</span>
            <AppDropdown
              value={defaultPlanName}
              onChange={setDefaultPlanName}
              options={planOptions}
              ariaLabel="Select default provisioning plan"
              className="mt-2"
              disabled={plans.length === 0}
            />
          </div>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={isSubmitting || plans.length === 0}>
              Create
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      {oneTimeToken && (
        <section className="mb-8 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">{oneTimeToken.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                Copy this token now. You will not be able to view it again.
              </p>
              <div className="mt-4 overflow-x-auto py-2">
                <code className="whitespace-nowrap font-mono text-xs text-slate-200">
                  {oneTimeToken.token}
                </code>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <SecondaryButton type="button" onClick={handleCopyToken}>
                <Clipboard size={16} aria-hidden="true" />
                Copy
              </SecondaryButton>
              <SecondaryButton type="button" onClick={closeOneTimeToken}>
                Close
              </SecondaryButton>
            </div>
          </div>
        </section>
      )}

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading provisioning tokens...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={KeyRound}
            title="Provisioning tokens unavailable"
            description={errorMessage}
          />
        ) : tokens.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No provisioning tokens yet"
            description="Create one to connect an external signup flow."
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Default plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Last used</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="transition-colors hover:bg-slate-900/25">
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-slate-100">{token.name}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {getPlanLabel(token.defaultPlanName)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        token.active
                          ? 'bg-emerald-950/30 text-emerald-300/90'
                          : 'bg-slate-900/40 text-slate-500'
                      }`}>
                        {token.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {formatDateTime(token.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {token.lastUsedAt ? formatDateTime(token.lastUsedAt) : 'Never'}
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      {canMutate && (
                        <RowActions
                          actions={[
                            {
                              label: token.active ? 'Disable' : 'Already disabled',
                              tone: token.active ? 'danger' : 'default',
                              disabled: !token.active || isSubmitting,
                              title: token.active ? undefined : 'This token is already disabled',
                              onClick: () => handleDisableToken(token)
                            }
                          ]}
                        />
                      )}
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
};
