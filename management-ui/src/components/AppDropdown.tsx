import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface AppDropdownProps {
  label?: string;
  ariaLabel: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  displayValue?: React.ReactNode;
  fullWidth?: boolean;
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  showChevron?: boolean;
}

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ');

export const AppDropdown: React.FC<AppDropdownProps> = ({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  displayValue,
  fullWidth = true,
  align = 'left',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  showChevron = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      {label && <p className="mb-2 text-sm text-slate-500">{label}</p>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cx(
          'flex h-9 items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 text-left text-sm text-slate-200 outline-none transition-colors hover:border-slate-700 hover:bg-slate-900/70 focus:border-slate-600 focus:ring-2 focus:ring-slate-700/25 disabled:cursor-not-allowed disabled:text-slate-600',
          fullWidth ? 'w-full' : 'w-auto',
          buttonClassName
        )}
      >
        <span className="min-w-0 truncate">{displayValue ?? selectedOption?.label ?? 'Select'}</span>
        {showChevron && (
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cx('shrink-0 text-slate-600 transition-transform', isOpen && 'rotate-180')}
          />
        )}
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={cx(
            'absolute top-full z-30 mt-1 max-h-64 min-w-full overflow-y-auto rounded-md border border-slate-800/80 bg-slate-950 py-1 shadow-xl shadow-black/25',
            align === 'right' ? 'right-0' : 'left-0',
            fullWidth && 'right-0',
            menuClassName
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cx(
                  'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                  isSelected ? 'text-slate-100' : 'text-slate-400',
                  option.disabled
                    ? 'cursor-not-allowed text-slate-700'
                    : 'hover:bg-slate-900/75 hover:text-slate-100'
                )}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-500">
                  {isSelected && <Check size={13} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.description && (
                    <span className="mt-0.5 block truncate text-xs text-slate-600">{option.description}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
