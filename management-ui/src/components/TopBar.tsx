import React from 'react';
import { Menu } from 'lucide-react';
import { pacificWaveMark } from '../assets/brand';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onMenuClick }) => (
  <header
    aria-label="Application header"
    className="flex h-14 shrink-0 items-center justify-between bg-slate-950 px-4 lg:hidden"
  >
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={pacificWaveMark}
        alt="pacific logo"
        className="h-7 w-7 shrink-0 object-contain"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-none text-slate-100">pacific</p>
        <p className="mt-1 truncate text-xs text-slate-600">{title}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onMenuClick}
      aria-label="Open navigation"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-900/60 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/35"
    >
      <Menu size={19} aria-hidden="true" />
    </button>
  </header>
);
