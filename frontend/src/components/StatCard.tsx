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
    if (t.includes('volume')) return <ShieldCheck className="w-5 h-5 text-rose-400" />;
    if (t.includes('flagged')) return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    if (t.includes('accuracy')) return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    if (t.includes('latency')) return <Zap className="w-5 h-5 text-cyan-400" />;
    return <Clock className="w-5 h-5 text-purple-400" />;
  };

  const getBorderGlow = (color: string) => {
    switch (color) {
      case 'rose': return 'hover:border-rose-500/40 group-hover:shadow-[0_0_20px_-8px_rgba(244,63,94,0.4)]';
      case 'amber': return 'hover:border-amber-500/40 group-hover:shadow-[0_0_20px_-8px_rgba(245,158,11,0.4)]';
      case 'emerald': return 'hover:border-emerald-500/40 group-hover:shadow-[0_0_20px_-8px_rgba(16,185,129,0.4)]';
      case 'cyan': return 'hover:border-cyan-500/40 group-hover:shadow-[0_0_20px_-8px_rgba(14,165,233,0.4)]';
      default: return 'hover:border-purple-500/40 group-hover:shadow-[0_0_20px_-8px_rgba(168,85,247,0.4)]';
    }
  };

  const getIconBg = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-500/10 border-rose-500/20';
      case 'amber': return 'bg-amber-500/10 border-amber-500/20';
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'cyan': return 'bg-cyan-500/10 border-cyan-500/20';
      default: return 'bg-purple-500/10 border-purple-500/20';
    }
  };

  return (
    <div
      className={`group relative bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-5 transition-all duration-300 ${getBorderGlow(
        data.badge_color
      )}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
          {data.title}
        </span>
        <div className={`p-2.5 rounded-xl border ${getIconBg(data.badge_color)}`}>
          {getIcon(data.title)}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          {data.value}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-mono">
        <span
          className={`flex items-center gap-0.5 font-medium ${
            data.change_direction === 'up'
              ? 'text-emerald-400'
              : data.change_direction === 'down'
              ? 'text-rose-400'
              : 'text-slate-400'
          }`}
        >
          {data.change_direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
          {data.change_direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
          {data.change_direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
          {data.change_pct}
        </span>
        <span className="text-slate-500 text-[11px]">vs yesterday</span>
      </div>
    </div>
  );
};
