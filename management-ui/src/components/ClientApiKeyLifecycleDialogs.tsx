import React, { useEffect, useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { ClientApiKeyRotationResponse, ClientDto } from '../types';
import { DangerButton, PrimaryButton, SecondaryButton } from './Button';

export type PendingClientLifecycleAction = {
  kind: 'rotate' | 'disable';
  client: ClientDto;
};

interface ClientApiKeyLifecycleDialogsProps {
  pendingAction: PendingClientLifecycleAction | null;
  rotatedKey: ClientApiKeyRotationResponse | null;
  isSubmitting: boolean;
  onCancelPendingAction: () => void;
  onConfirmRotate: () => void;
  onConfirmDisable: () => void;
  onCloseRotatedKey: () => void;
  onCopyRotatedKey: () => Promise<boolean>;
}

const modalBackdropClass = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm';
const modalPanelClass = 'glass-popover w-full max-w-lg rounded-lg p-5';

export const ClientApiKeyLifecycleDialogs: React.FC<ClientApiKeyLifecycleDialogsProps> = ({
  pendingAction,
  rotatedKey,
  isSubmitting,
  onCancelPendingAction,
  onConfirmRotate,
  onConfirmDisable,
  onCloseRotatedKey,
  onCopyRotatedKey
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setHasCopied(false);
  }, [rotatedKey?.apiKey]);

  useEffect(() => {
    if (!hasCopied) return undefined;

    const timeoutId = window.setTimeout(() => {
      setHasCopied(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasCopied]);

  const handleCopyRotatedKey = async () => {
    const copied = await onCopyRotatedKey();
    if (copied) {
      setHasCopied(true);
    }
  };

  if (rotatedKey) {
    return (
      <div className={modalBackdropClass} role="dialog" aria-modal="true" aria-labelledby="new-api-key-title">
        <div className={modalPanelClass}>
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 text-slate-500" size={18} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 id="new-api-key-title" className="text-base font-semibold text-slate-100">New API key</h2>
              <p className="mt-2 text-sm text-slate-400">
                Copy this key now. You will not be able to view it again.
              </p>
            </div>
          </div>

          <div className="glass-highlight mt-4 rounded-md p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">{rotatedKey.clientName}</p>
            <p className="break-all font-mono text-sm leading-6 text-slate-100">{rotatedKey.apiKey}</p>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <SecondaryButton type="button" onClick={handleCopyRotatedKey}>
              <Copy size={15} aria-hidden="true" />
              {hasCopied ? 'Copied' : 'Copy'}
            </SecondaryButton>
            <PrimaryButton type="button" onClick={onCloseRotatedKey}>
              Done
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  if (!pendingAction) return null;

  const isRotate = pendingAction.kind === 'rotate';
  const title = isRotate ? 'Rotate API key?' : 'Disable client?';
  const body = isRotate
    ? 'The current API key will stop working immediately. Copy the new key after rotation; it will only be shown once.'
    : 'Disabling this client will prevent its API key from accessing protected routes.';

  return (
    <div className={modalBackdropClass} role="dialog" aria-modal="true" aria-labelledby="client-action-title">
      <div className={modalPanelClass}>
        <h2 id="client-action-title" className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{body}</p>
        <p className="mt-4 text-sm font-medium text-slate-100">{pendingAction.client.clientName}</p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <SecondaryButton type="button" onClick={onCancelPendingAction} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          {isRotate ? (
            <PrimaryButton type="button" onClick={onConfirmRotate} disabled={isSubmitting}>
              Rotate key
            </PrimaryButton>
          ) : (
            <DangerButton type="button" onClick={onConfirmDisable} disabled={isSubmitting}>
              Disable client
            </DangerButton>
          )}
        </div>
      </div>
    </div>
  );
};
