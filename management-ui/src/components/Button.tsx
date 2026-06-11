import React from 'react';

export interface DisabledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}

export const DisabledButton: React.FC<DisabledButtonProps> = ({
  disabled,
  tooltip,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      disabled={disabled}
      className={`${baseClass} ${disabledClass} ${className}`}
      title={tooltip}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export const PrimaryButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white';
  return (
    <DisabledButton
      className={baseClass}
      {...props}
    />
  );
};

export const DangerButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white';
  return (
    <DisabledButton
      className={baseClass}
      {...props}
    />
  );
};

export const SecondaryButton: React.FC<DisabledButtonProps> = (props) => {
  const baseClass = !props.disabled ? 'bg-gray-300 text-gray-900 hover:bg-gray-400' : 'bg-gray-300 text-gray-900';
  return (
    <DisabledButton
      className={baseClass}
      {...props}
    />
  );
};

