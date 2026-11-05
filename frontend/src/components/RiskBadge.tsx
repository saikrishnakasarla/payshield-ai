import React from 'react';
import { RiskLevel } from '../lib/types';
import { CheckCircle2, AlertTriangle, ShieldAlert, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const configs = {
    LOW: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      label: 'LOW RISK',
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      label: 'MEDIUM RISK',
    },
    HIGH: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: ShieldAlert,
      iconColor: 'text-rose-600',
      label: 'HIGH RISK',
    },
    CRITICAL: {
      bg: 'bg-red-100 text-red-900 border-red-300 font-bold',
      icon: AlertOctagon,
      iconColor: 'text-red-700',
      label: 'CRITICAL RISK',
    },
  };

  const config = configs[level] || configs.LOW;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 font-semibold gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const scoreText = score !== undefined ? ` (${score}/100)` : '';
  const ariaLabel = `Risk Classification: ${config.label}${score !== undefined ? `, Score ${score} out of 100` : ''}`;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono tracking-wide transition-all ${config.bg} ${sizeClasses[size]}`}
      role="status"
      aria-label={ariaLabel}
    >
      <IconComponent className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0`} aria-hidden="true" />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="font-semibold text-slate-700">{scoreText}</span>
      )}
    </span>
  );
};
