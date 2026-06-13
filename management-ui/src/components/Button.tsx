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
  const baseClass = 'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700/35';
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
    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'bg-slate-800 text-slate-300';
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
    ? 'bg-slate-900/55 text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
    : 'bg-slate-900/45 text-slate-500';
  return (
    <DisabledButton
      {...props}
      className={cx(baseClass, props.className)}
    />
  );
};
