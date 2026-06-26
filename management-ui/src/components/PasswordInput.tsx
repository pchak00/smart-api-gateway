import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  inputClassName: string;
  wrapperClassName?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  inputClassName,
  wrapperClassName = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        {...props}
        type={isVisible ? 'text' : 'password'}
        className={`${inputClassName} pr-10`}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-600 transition-colors hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-700/40"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
      >
        <Icon size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
