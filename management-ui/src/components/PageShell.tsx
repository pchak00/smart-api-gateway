import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
}

interface DemoBadgeProps {
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  meta
}) => (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-normal text-slate-50">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      {meta && <div className="mt-3">{meta}</div>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => (
  <section className={`rounded-lg border border-slate-800 bg-slate-900/70 shadow-sm shadow-black/20 ${className}`}>
    {children}
  </section>
);

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
  <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
    {Icon && (
      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-400">
        <Icon size={22} aria-hidden="true" />
      </div>
    )}
    <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

export const DemoBadge: React.FC<DemoBadgeProps> = ({ children = 'Demo preview' }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
    {children}
  </span>
);
