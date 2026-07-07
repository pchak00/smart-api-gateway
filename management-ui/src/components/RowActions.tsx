import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';

export interface RowAction {
  label: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  tone?: 'default' | 'danger';
}

interface RowActionsProps {
  actions: RowAction[];
  label?: string;
}

const itemClass = (tone: RowAction['tone'], disabled?: boolean) => {
  const toneClass = tone === 'danger'
    ? 'text-red-300/80 hover:bg-red-950/30 hover:text-red-200'
    : 'text-slate-300 hover:bg-slate-800/65 hover:text-slate-100';

  return [
    'block w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
    disabled ? 'cursor-not-allowed text-slate-600 opacity-70' : toneClass
  ].join(' ');
};

export const RowActions: React.FC<RowActionsProps> = ({ actions, label = 'Row actions' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
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
    <div ref={menuRef} className="relative inline-flex justify-end">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((open) => !open);
        }}
        className="pacific-icon-focus inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-900/70 hover:text-slate-200"
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          onClick={(event) => event.stopPropagation()}
          className="glass-popover absolute right-0 top-9 z-30 min-w-36 rounded-lg p-1"
        >
          {actions.map((action) => {
            const className = itemClass(action.tone, action.disabled);

            if (action.to && !action.disabled) {
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  role="menuitem"
                  className={className}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen(false);
                  }}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                title={action.title}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onClick?.();
                  setIsOpen(false);
                }}
                className={className}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
