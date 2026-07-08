import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mobileMenuStyle, setMobileMenuStyle] = useState<React.CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const updateMobileMenuPosition = useCallback(() => {
    const root = rootRef.current;

    if (!root || typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches) {
      setMobileMenuStyle(null);
      return;
    }

    const rect = root.getBoundingClientRect();
    const viewportPadding = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(Math.max(rect.width, 220), viewportWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      viewportWidth - viewportPadding - width
    );
    const spaceBelow = viewportHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      140,
      Math.min(256, (placeAbove ? spaceAbove : spaceBelow) - 8)
    );
    const top = placeAbove
      ? Math.max(viewportPadding, rect.top - availableHeight - 8)
      : Math.min(rect.bottom + 4, viewportHeight - viewportPadding - availableHeight);

    setMobileMenuStyle({
      left,
      top,
      width,
      maxHeight: availableHeight,
      position: 'fixed',
      zIndex: 60
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateMobileMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateMobileMenuPosition();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, updateMobileMenuPosition]);

  useEffect(() => {
    if (!isOpen) {
      setMobileMenuStyle(null);
    }
  }, [isOpen]);

  const menuNode = isOpen ? (
    <div
      ref={menuRef}
      role="listbox"
      aria-label={ariaLabel}
      style={mobileMenuStyle ?? undefined}
      className={cx(
        'glass-popover overflow-y-auto rounded-md py-1',
        mobileMenuStyle
          ? ''
          : cx(
              'absolute top-full z-30 mt-1 max-h-64 min-w-full',
              align === 'right' ? 'right-0' : 'left-0',
              fullWidth && 'right-0'
            ),
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
  ) : null;

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
          'pacific-line-focus flex h-9 items-center justify-between gap-2 border-b border-slate-800/70 bg-transparent px-0 text-left text-sm text-slate-200 outline-none transition-colors hover:border-slate-700/90 hover:bg-slate-900/15 focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:text-slate-600',
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

      {mobileMenuStyle && menuNode ? createPortal(menuNode, document.body) : menuNode}
    </div>
  );
};
