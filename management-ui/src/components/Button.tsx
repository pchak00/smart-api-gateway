import React from 'react';

export interface DisabledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  'aria-label': string;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

export const DisabledButton: React.FC<DisabledButtonProps> = ({
  disabled,
  tooltip,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/20';
  const disabledClass = disabled ? 'cursor-not-allowed opacity-50' : '';

  return (
    <button
      disabled={disabled}
      className={cx(baseClass, disabledClass, className)}
      title={tooltip}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export const PrimaryButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled
    ? 'bg-slate-800/65 text-slate-100 hover:bg-slate-700/70'
    : 'bg-slate-800/45 text-slate-400';
  return (
    <DisabledButton
      {...props}
      className={cx(baseClass, props.className)}
    />
  );
};

export const DangerButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled
    ? 'bg-red-950/35 text-red-300 hover:bg-red-950/55'
    : 'bg-red-950/30 text-red-300';
  return (
    <DisabledButton
      {...props}
      className={cx(baseClass, props.className)}
    />
  );
};

export const SecondaryButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled
    ? 'bg-transparent text-slate-400 hover:bg-slate-900/35 hover:text-slate-100'
    : 'bg-transparent text-slate-600';
  return (
    <DisabledButton
      {...props}
      className={cx(baseClass, props.className)}
    />
  );
};

export const IconButton: React.FC<IconButtonProps> = ({
  disabled,
  tooltip,
  children,
  className = '',
  ...props
}) => {
  const tooltipId = React.useId();
  const baseClass = [
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors',
    'hover:bg-slate-900/45 hover:text-slate-100',
    'focus:outline-none focus:ring-2 focus:ring-slate-700/35',
    'disabled:cursor-not-allowed disabled:text-slate-600 disabled:opacity-55'
  ].join(' ');

  return (
    <span className="group relative inline-flex">
      <button
        disabled={disabled}
        aria-describedby={tooltipId}
        aria-disabled={disabled}
        className={cx(baseClass, className)}
        {...props}
      >
        {children}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-lg shadow-black/25 ring-1 ring-slate-800/70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
};
