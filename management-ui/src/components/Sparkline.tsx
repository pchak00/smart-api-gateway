import React from 'react';

interface SparklineProps {
  values: number[];
  color: string;
  label: string;
  className?: string;
}

const width = 144;
const height = 34;
const padding = 2;

const safeValues = (values: number[]) => (
  values.map((value) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(value, 0) : 0))
);

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  color,
  label,
  className = ''
}) => {
  const points = safeValues(values);

  if (points.length === 0) {
    return <p className={`mt-3 text-xs text-slate-600 ${className}`}>No trend yet</p>;
  }

  const maxValue = Math.max(...points);
  const minValue = Math.min(...points);
  const range = maxValue - minValue;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const coordinates = points.length === 1
    ? [
        [padding, height / 2],
        [width - padding, height / 2]
      ]
    : points.map((value, index) => {
        const x = padding + (index / (points.length - 1)) * usableWidth;
        const y = range === 0
          ? height / 2
          : height - padding - ((value - minValue) / range) * usableHeight;

        return [x, y];
      });

  const path = coordinates
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');

  return (
    <svg
      className={`mt-3 h-8 w-full max-w-36 overflow-visible ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <title>{label}</title>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        opacity="0.82"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
