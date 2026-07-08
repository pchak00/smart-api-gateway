import React from 'react';
import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onMenuClick }) => (
  <header
    aria-label="Application header"
    className="flex h-14 shrink-0 items-center gap-3 px-3 sm:px-4 lg:hidden"
  >
    <button
      type="button"
      onClick={onMenuClick}
      aria-label="Open navigation"
      className="pacific-icon-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-900/60 hover:text-slate-100"
    >
      <Menu size={19} aria-hidden="true" />
    </button>
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold leading-none text-slate-100">{title}</p>
      <p className="mt-1 truncate text-xs text-slate-600">pacific</p>
    </div>
  </header>
);
