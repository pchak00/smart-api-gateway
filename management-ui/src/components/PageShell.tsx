import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  titleAccessory?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

interface PageContainerProps {
  children: React.ReactNode;
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
  titleAccessory,
  description,
  actions,
  meta
}) => (
  <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-7 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0 max-w-3xl">
      {eyebrow && (
        <p className="mb-2 text-sm font-medium text-slate-500">
          {eyebrow}
        </p>
      )}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h1 className="min-w-0 text-2xl font-semibold text-slate-100">{title}</h1>
        {titleAccessory}
      </div>
      {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
      {meta && <div className="mt-3">{meta}</div>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => (
  <div className="w-full px-4 py-6 sm:px-5 md:px-6 lg:px-8 lg:py-8 2xl:px-10">
    {children}
  </div>
);

export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => (
  <section className={`glass-panel min-w-0 rounded-lg ${className}`}>
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
  <span className="inline-flex items-center rounded-md bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-slate-500">
    {children}
  </span>
);
