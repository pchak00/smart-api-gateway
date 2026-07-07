import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface InfoTooltipProps {
  label: string;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  label,
  children,
  align = 'left'
}) => {
  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <Tooltip
      content={children}
      wrapperClassName="relative inline-flex shrink-0"
      tooltipClassName={`pointer-events-none absolute ${alignmentClass} top-full z-30 mt-2 w-64 rounded-md border border-slate-800/80 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400 shadow-xl shadow-black/25`}
    >
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-950/45 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-700/35"
        aria-label={label}
      >
        <Info size={13} aria-hidden="true" />
      </button>
    </Tooltip>
  );
};
