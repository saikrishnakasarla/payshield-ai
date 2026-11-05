import React from 'react';
import { RiskLevel } from '../../lib/types';
import { RiskBadge } from '../../components/RiskBadge';

interface RiskScoreGaugeProps {
  score: number;
  level: RiskLevel;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({ score, level }) => {
  // Semi-circle gauge calculation
  const radius = 70;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (lvl: RiskLevel) => {
    switch (lvl) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#E11D48';
      case 'MEDIUM': return '#D97706';
      default: return '#059669';
    }
  };

  const color = getColor(level);

  return (
    <div className="flex flex-col items-center justify-center p-4" role="region" aria-label="Risk Score Gauge">
      <div className="relative w-44 h-28 flex items-center justify-center overflow-hidden">
        <svg className="w-44 h-44 -rotate-180 transform translate-y-7" viewBox="0 0 160 160" aria-hidden="true">
          {/* Background Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Active Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Numbers */}
        <div className="absolute top-10 flex flex-col items-center">
          <div className="flex items-baseline">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{score}</span>
            <span className="text-sm font-mono text-slate-400 ml-1">/100</span>
          </div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
            Risk Index
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center gap-1.5">
        <RiskBadge level={level} size="lg" />
        <span className="text-[11px] text-slate-500 font-mono text-center">
          Multi-Signal Bounded Rule Score [0-100]
        </span>
      </div>
    </div>
  );
};
