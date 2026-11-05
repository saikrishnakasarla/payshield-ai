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
    if (t.includes('volume')) return <ShieldCheck className="w-5 h-5 text-blue-600" aria-hidden="true" />;
    if (t.includes('flagged')) return <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />;
    if (t.includes('accuracy')) return <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />;
    if (t.includes('latency')) return <Zap className="w-5 h-5 text-teal-600" aria-hidden="true" />;
    return <Clock className="w-5 h-5 text-purple-600" aria-hidden="true" />;
  };

  const getIconBg = (color: string) => {
    switch (color) {
      case 'rose': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'amber': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'emerald': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'cyan': return 'bg-teal-50 border-teal-200 text-teal-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase font-sans">
          {data.title}
        </span>
        <div className={`p-2.5 rounded-xl border ${getIconBg(data.badge_color)}`}>
          {getIcon(data.title)}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900">
          {data.value}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-mono">
        <span
          className={`flex items-center gap-0.5 font-semibold ${
            data.change_direction === 'up'
              ? 'text-emerald-700'
              : data.change_direction === 'down'
              ? 'text-rose-700'
              : 'text-slate-600'
          }`}
        >
          {data.change_direction === 'up' && <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
          {data.change_direction === 'down' && <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
          {data.change_direction === 'neutral' && <Minus className="w-3.5 h-3.5" aria-hidden="true" />}
          {data.change_pct}
        </span>
        <span className="text-slate-500 text-[11px]">vs yesterday</span>
      </div>
    </div>
  );
};
