import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
}

const toNextValue = (
  currentValue: string,
  direction: 1 | -1,
  step: number,
  min?: number,
  max?: number
) => {
  const parsedValue = Number(currentValue);
  const fallback = typeof min === 'number' ? min : 0;
  const nextValue = (Number.isFinite(parsedValue) ? parsedValue : fallback) + direction * step;
  const boundedValue = Math.min(
    typeof max === 'number' ? max : Number.POSITIVE_INFINITY,
    Math.max(typeof min === 'number' ? min : Number.NEGATIVE_INFINITY, nextValue)
  );

  return Number.isInteger(step) ? String(Math.round(boundedValue)) : String(Number(boundedValue.toFixed(2)));
};

export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  step = 1,
  min,
  max,
  className = '',
  disabled,
  ...props
}) => (
  <div className="mt-2 flex border-b border-slate-800/70 bg-transparent pr-1 transition-colors hover:border-slate-700/90 focus-within:border-cyan-400/70 focus-within:ring-2 focus-within:ring-cyan-400/20">
    <input
      {...props}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`min-w-0 flex-1 bg-transparent px-0 py-2 text-sm text-slate-100 outline-none disabled:cursor-not-allowed disabled:text-slate-600 ${className}`}
    />
    <div className="flex shrink-0 items-stretch gap-1 py-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(toNextValue(value, -1, step, min, max))}
        className="flex w-7 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-900/35 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:text-slate-700"
        aria-label="Decrease value"
      >
        <Minus size={13} aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(toNextValue(value, 1, step, min, max))}
        className="flex w-7 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-900/35 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:text-slate-700"
        aria-label="Increase value"
      >
        <Plus size={13} aria-hidden="true" />
      </button>
    </div>
  </div>
);
