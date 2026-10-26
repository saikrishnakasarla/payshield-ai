import React from 'react';
import { RiskLevel } from '../lib/types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const configs = {
    LOW: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      label: 'LOW RISK',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
      label: 'MEDIUM RISK',
    },
    HIGH: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
      label: 'HIGH RISK',
    },
  };

  const config = configs[level] || configs.LOW;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wider transition-all duration-200 ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="opacity-80 font-normal">({score}/100)</span>
      )}
    </span>
  );
};
