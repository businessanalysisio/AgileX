import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'pink' | 'violet' | 'blue';
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
}

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',   border: 'border-amber-100' },
  pink:    { bg: 'bg-pink-50',    icon: 'bg-pink-100 text-pink-600',     border: 'border-pink-100' },
  violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600', border: 'border-violet-100' },
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',     border: 'border-blue-100' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color = 'indigo', icon, trend }) => {
  const c = COLOR_MAP[color];
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 flex items-start gap-4 shadow-sm`}>
      <div className={`p-3 rounded-xl ${c.icon} flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
};
