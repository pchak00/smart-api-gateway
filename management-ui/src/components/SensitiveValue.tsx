import React, { useEffect } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface SensitiveValueProps {
  value?: string | null;
  revealed: boolean;
  onRevealedChange: (revealed: boolean) => void;
  copyMessage: string;
  missingLabel?: string;
  autoHideMs?: number;
  className?: string;
}

const demoPrefixPattern = /^([a-z]+-demo)/i;

export const maskApiKey = (value?: string | null) => {
  const key = value?.trim();
  if (!key) return '';

  const demoPrefix = key.match(demoPrefixPattern)?.[1];
  if (demoPrefix) return `${demoPrefix}••••`;

  if (key.length <= 8) return `••••${key.slice(-2)}`;

  return `••••••••${key.slice(-5)}`;
};

export const SensitiveValue: React.FC<SensitiveValueProps> = ({
  value,
  revealed,
  onRevealedChange,
  copyMessage,
  missingLabel = 'Not available',
  autoHideMs = 12000,
  className = ''
}) => {
  const { showToast } = useToast();
  const hasValue = Boolean(value);

  useEffect(() => {
    if (!revealed || !hasValue || autoHideMs <= 0) return undefined;

    const timeoutId = window.setTimeout(() => onRevealedChange(false), autoHideMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoHideMs, hasValue, onRevealedChange, revealed]);

  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      showToast({ message: copyMessage, type: 'success' });
    } catch {
      showToast({ message: 'Could not copy API key.', type: 'error' });
    }
  };

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span className="min-w-0 truncate font-mono text-xs text-slate-300">
        {hasValue ? (revealed ? value : maskApiKey(value)) : missingLabel}
      </span>
      {hasValue && (
        <span className="inline-flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-900/70 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-700/35"
            aria-label="Copy API key"
            title="Copy API key"
          >
            <Copy size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onRevealedChange(!revealed)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-900/70 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-700/35"
            aria-label={revealed ? 'Hide API key' : 'Reveal API key'}
            title={revealed ? 'Hide API key' : 'Reveal API key'}
          >
            {revealed ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
          </button>
        </span>
      )}
    </div>
  );
};
