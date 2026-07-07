import React from 'react';
import { Tooltip } from './Tooltip';

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
  const baseClass = 'pacific-control-focus inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors';
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
    ? 'bg-slate-900/35 text-slate-100 hover:bg-slate-800/45'
    : 'bg-slate-900/20 text-slate-500';
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
    ? 'bg-transparent text-slate-400 hover:bg-slate-900/25 hover:text-slate-100'
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
  const baseClass = [
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors',
    'hover:bg-slate-900/35 hover:text-slate-100',
    'pacific-icon-focus',
    'disabled:cursor-not-allowed disabled:text-slate-600 disabled:opacity-55'
  ].join(' ');

  return (
    <Tooltip
      content={tooltip}
      wrapperClassName="relative inline-flex"
      tooltipClassName="pointer-events-none absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-xs font-medium text-slate-200 shadow-lg shadow-black/25 ring-1 ring-slate-800/70"
    >
      <button
        disabled={disabled}
        aria-disabled={disabled}
        className={cx(baseClass, className)}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
};
