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
  <div className="mt-2 flex rounded-md border border-slate-800 bg-slate-950 transition-colors focus-within:border-slate-600 focus-within:ring-2 focus-within:ring-slate-700/20">
    <input
      {...props}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`min-w-0 flex-1 rounded-l-md bg-transparent px-3 py-2 text-sm text-slate-100 outline-none disabled:cursor-not-allowed disabled:text-slate-600 ${className}`}
    />
    <div className="flex shrink-0 border-l border-slate-800/70">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(toNextValue(value, -1, step, min, max))}
        className="flex w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-900/70 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-700/30 disabled:cursor-not-allowed disabled:text-slate-700"
        aria-label="Decrease value"
      >
        <Minus size={13} aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(toNextValue(value, 1, step, min, max))}
        className="flex w-8 items-center justify-center rounded-r-md text-slate-500 transition-colors hover:bg-slate-900/70 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-700/30 disabled:cursor-not-allowed disabled:text-slate-700"
        aria-label="Increase value"
      >
        <Plus size={13} aria-hidden="true" />
      </button>
    </div>
  </div>
);
