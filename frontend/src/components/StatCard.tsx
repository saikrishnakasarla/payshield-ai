import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from 'lucide-react';
import { MetricCardData } from '../lib/types';

interface StatCardProps {
  data: MetricCardData;
}

export const StatCard: React.FC<StatCardProps> = ({ data }) => {
  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('volume')) return <ShieldCheck className="w-5 h-5 text-soc-cyan" aria-hidden="true" />;
    if (t.includes('flagged')) return <AlertTriangle className="w-5 h-5 text-soc-warning" aria-hidden="true" />;
    if (t.includes('accuracy')) return <CheckCircle2 className="w-5 h-5 text-soc-teal" aria-hidden="true" />;
    if (t.includes('latency')) return <Zap className="w-5 h-5 text-soc-cyan" aria-hidden="true" />;
    return <Clock className="w-5 h-5 text-soc-teal" aria-hidden="true" />;
  };

  const getIconBg = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-soc-danger/15 border-soc-danger/30 text-soc-danger shadow-[0_0_10px_rgba(255,82,99,0.2)]';
      case 'amber': return 'bg-soc-warning/15 border-soc-warning/30 text-soc-warning shadow-[0_0_10px_rgba(255,181,71,0.2)]';
      case 'emerald': return 'bg-soc-teal/15 border-soc-teal/30 text-soc-teal shadow-[0_0_10px_rgba(0,245,200,0.2)]';
      case 'cyan': return 'bg-soc-cyan/15 border-soc-cyan/30 text-soc-cyan shadow-[0_0_10px_rgba(0,229,255,0.2)]';
      default: return 'bg-soc-cyan/15 border-soc-cyan/30 text-soc-cyan shadow-[0_0_10px_rgba(0,229,255,0.2)]';
    }
  };

  return (
    <div className="bg-soc-card/90 border border-soc-cyan/25 hover:border-soc-cyan/50 rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(0,229,255,0.12)] transition-all group backdrop-blur-md">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-soc-textMuted tracking-wider uppercase font-sans">
          {data.title}
        </span>
        <div className={`p-2.5 rounded-xl border ${getIconBg(data.badge_color)}`}>
          {getIcon(data.title)}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-soc-cyan transition-colors">
          {data.value}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-mono">
        <span
          className={`flex items-center gap-0.5 font-semibold ${
            data.change_direction === 'up'
              ? 'text-soc-teal'
              : data.change_direction === 'down'
              ? 'text-soc-danger'
              : 'text-soc-textMuted'
          }`}
        >
          {data.change_direction === 'up' && <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
          {data.change_direction === 'down' && <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
          {data.change_direction === 'neutral' && <Minus className="w-3.5 h-3.5" aria-hidden="true" />}
          {data.change_pct}
        </span>
        <span className="text-soc-textMuted text-[11px]">vs yesterday</span>
      </div>
    </div>
  );
};
