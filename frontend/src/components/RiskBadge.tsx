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
      bg: 'bg-soc-teal/15 text-soc-teal border-soc-teal/40 shadow-[0_0_10px_rgba(0,245,200,0.15)]',
      icon: CheckCircle2,
      iconColor: 'text-soc-teal',
      label: 'LOW RISK',
    },
    MEDIUM: {
      bg: 'bg-soc-warning/15 text-soc-warning border-soc-warning/40 shadow-[0_0_10px_rgba(255,181,71,0.15)]',
      icon: AlertTriangle,
      iconColor: 'text-soc-warning',
      label: 'MEDIUM RISK',
    },
    HIGH: {
      bg: 'bg-soc-danger/15 text-soc-danger border-soc-danger/40 shadow-[0_0_10px_rgba(255,82,99,0.2)]',
      icon: ShieldAlert,
      iconColor: 'text-soc-danger',
      label: 'HIGH RISK',
    },
    CRITICAL: {
      bg: 'bg-red-950/80 text-red-200 border-red-500/60 font-bold shadow-[0_0_15px_rgba(255,82,99,0.35)]',
      icon: AlertOctagon,
      iconColor: 'text-red-400',
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

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono tracking-wide transition-all backdrop-blur-sm ${config.bg} ${sizeClasses[size]}`}
      role="status"
    >
      <IconComponent className={`${iconSizes[size]} ${config.iconColor}`} aria-hidden="true" />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono">({score})</span>
      )}
    </span>
  );
};
