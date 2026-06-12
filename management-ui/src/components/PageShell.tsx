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
  <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="mb-2 text-sm font-medium text-slate-500">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-normal text-slate-100">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {meta && <div className="mt-3">{meta}</div>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => (
  <section className={`rounded-xl bg-slate-900/55 shadow-sm shadow-black/10 ${className}`}>
    {children}
  </section>
);

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
  <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
    {Icon && (
      <div className="mb-4 text-slate-600">
        <Icon size={22} aria-hidden="true" />
      </div>
    )}
    <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

export const DemoBadge: React.FC<DemoBadgeProps> = ({ children = 'Demo preview' }) => (
  <span className="inline-flex items-center rounded-full bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-400">
    {children}
  </span>
);
