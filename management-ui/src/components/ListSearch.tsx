import React from 'react';

interface ListSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultLabel?: string;
}

export const ListSearch: React.FC<ListSearchProps> = ({
  value,
  onChange,
  placeholder,
  resultLabel
}) => (
  <div className="flex w-full flex-col gap-2 sm:max-w-sm">
    <div className="flex items-center rounded-md border border-slate-800 bg-slate-950/75 px-3 transition-colors focus-within:border-slate-600">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-700"
      />
      {value.trim() && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="ml-2 shrink-0 text-xs font-medium text-slate-600 transition-colors hover:text-slate-300"
        >
          Clear
        </button>
      )}
    </div>
    {resultLabel && (
      <p className="text-xs text-slate-600">{resultLabel}</p>
    )}
  </div>
);
