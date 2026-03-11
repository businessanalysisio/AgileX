import React from 'react';

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, maxValue, height = 120 }) => {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">
            {item.value > 999 ? `${(item.value / 1000).toFixed(1)}k` : item.value.toFixed(0)}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              backgroundColor: item.color,
              height: `${Math.max((item.value / max) * (height - 24), 4)}px`,
            }}
          />
          <span className="text-xs text-gray-400 text-center leading-tight" style={{ fontSize: 10 }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Mini Sparkline (SVG) ─────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = '#6366f1', width = 120, height = 40 }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const xStep = width / (data.length - 1);
  const yScale = (v: number) => height - ((v - min) / (max - min)) * (height - 4) - 2;
  const points = data.map((v, i) => `${i * xStep},${yScale(v)}`).join(' ');
  const areaPoints = `0,${height} ${points} ${(data.length - 1) * xStep},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ segments, size = 120 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const dashArray = (seg.value / total) * circumference;
        const dashOffset = circumference - offset * circumference / total - dashArray;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
            strokeDashoffset={circumference - offset * circumference / total}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'all 0.5s ease' }}
          />
        );
        offset += seg.value;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - 8} fill="white" />
    </svg>
  );
};
