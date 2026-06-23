import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KeyRound, SlidersHorizontal } from 'lucide-react';

const tabs = [
  { label: 'Gateway', path: '/settings/gateway', icon: SlidersHorizontal },
  { label: 'Provisioning', path: '/settings/provisioning', icon: KeyRound }
];

export const SettingsTabs: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      aria-label="Settings sections"
      className="mb-7 flex flex-wrap gap-2 border-b border-slate-800/40 pb-3"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`);

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-slate-900/65 text-slate-100'
                : 'text-slate-500 hover:bg-slate-900/45 hover:text-slate-300'
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
