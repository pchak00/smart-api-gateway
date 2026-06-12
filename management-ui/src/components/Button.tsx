import React from 'react';

export interface DisabledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  tooltip?: string;
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
  const baseClass = 'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/50';
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
    ? 'border border-blue-400/30 bg-blue-600 text-white shadow-sm shadow-blue-950/40 hover:bg-blue-500'
    : 'border border-blue-400/20 bg-blue-600 text-white';
  return (
    <DisabledButton
      {...props}
      className={cx(baseClass, props.className)}
    />
  );
};

export const DangerButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled
    ? 'border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20'
    : 'border border-red-400/10 bg-red-500/10 text-red-200';
  return (
    <DisabledButton
      {...props}
      className={cx(baseClass, props.className)}
    />
  );
};

export const SecondaryButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled
    ? 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800'
    : 'border border-slate-800 bg-slate-900 text-slate-300';
  return (
    <DisabledButton
      {...props}
      className={cx(baseClass, props.className)}
    />
  );
};
