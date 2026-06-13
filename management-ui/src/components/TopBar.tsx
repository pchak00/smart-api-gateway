import React from 'react';

export const TopBar: React.FC = () => (
  <header
    aria-label="Application header"
    className="flex h-12 shrink-0 items-center justify-end bg-slate-950 px-8"
  >
    <span className="text-xs text-slate-700">management console</span>
  </header>
);
