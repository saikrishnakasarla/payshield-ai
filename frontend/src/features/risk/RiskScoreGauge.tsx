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
      case 'CRITICAL': return '#FF3344';
      case 'HIGH': return '#FF5263';
      case 'MEDIUM': return '#FFB547';
      default: return '#00F5C8';
    }
  };

  const color = getColor(level);

  return (
    <div className="flex flex-col items-center justify-center p-4" role="region" aria-label="Risk Score Gauge">
      <div className="relative w-44 h-28 flex items-center justify-center overflow-hidden">
        <svg className="w-44 h-44 -rotate-180 transform translate-y-7" viewBox="0 0 160 160" aria-hidden="true">
          <defs>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#102538"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Active Glowing Arc */}
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
            filter="url(#gaugeGlow)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Numbers */}
        <div className="absolute top-10 flex flex-col items-center">
          <div className="flex items-baseline">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight drop-shadow-md">{score}</span>
            <span className="text-sm font-mono text-soc-cyan ml-1">/100</span>
          </div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-soc-textMuted mt-0.5">
            Risk Index
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center gap-1.5">
        <RiskBadge level={level} size="lg" />
        <span className="text-[11px] text-soc-textMuted font-mono text-center">
          Multi-Signal Bounded Rule Score [0-100]
        </span>
      </div>
    </div>
  );
};
