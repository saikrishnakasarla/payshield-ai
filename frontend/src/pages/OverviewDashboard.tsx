import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  ShieldCheck, 
  Globe2, 
  Cpu, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { RiskBadge } from '../components/RiskBadge';
import { DashboardSummary, RiskLevel } from '../lib/types';
import { fetchDashboardSummary, resetDemoDatabase } from '../lib/api';

interface OverviewDashboardProps {
  onSelectTransaction: (txnId: number) => void;
  refreshTrigger?: number;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onSelectTransaction,
  refreshTrigger,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [timeframe, setTimeframe] = useState<string>('24h');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const loadDashboard = async (tf: string) => {
    setIsLoading(true);
    try {
      const res = await fetchDashboardSummary(tf);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(timeframe);
  }, [timeframe, refreshTrigger]);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo database to original reproducible synthetic transactions?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetDemoDatabase();
      await loadDashboard(timeframe);
    } catch (err: any) {
      console.error('Failed to reset demo data:', err);
      alert(err.message || 'Merchant sign-in required to reset demo data. Please log in.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Header
        title="Fraud Analytics"
        subtitle="Real-time detection metrics & model performance"
        selectedTimeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Demo notice banner */}
      <DemoNoticeBadge />

      {/* Metric Cards Row (5 Cards matching user mockup) */}
      {data && data.metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard data={data.metrics.risk_volume} />
          <StatCard data={data.metrics.flagged_today} />
          <StatCard data={data.metrics.deterministic_accuracy} />
          <StatCard data={data.metrics.avg_latency} />
          <StatCard data={data.metrics.under_review} />
        </div>
      )}

      {/* Middle Grid: Detection Timeline (8 cols) & High-Risk Origins (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Detection Timeline Chart (8 cols) */}
        <div className="lg:col-span-8 bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">Detection Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">High vs Medium risk transactions over time</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                <span className="text-slate-300">High Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                <span className="text-slate-300">Medium Risk</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {data && data.timeline && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                  <XAxis 
                    dataKey="timestamp_label" 
                    stroke="#64748B" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#1F293D' }} 
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#1F293D' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0B0E14', 
                      borderColor: '#2D3A54', 
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="high_risk"
                    name="High Risk"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHigh)"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium_risk"
                    name="Medium Risk"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* High-Risk Origins (4 cols) */}
        <div className="lg:col-span-4 bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-rose-400" />
              High-Risk Origins
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">View Map</span>
          </div>

          <div className="space-y-4">
            {data && data.high_risk_origins && data.high_risk_origins.map((origin) => (
              <div key={origin.country_code} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-4 bg-slate-800 rounded font-mono text-[10px] text-slate-300 flex items-center justify-center border border-slate-700">
                    {origin.country_code}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-200">{origin.country}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{origin.attempts} attempts</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {origin.flag_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#1F293D] text-[11px] text-slate-500 font-mono">
            Flags correlate with IP vs. billing country mismatch heuristics.
          </div>
        </div>

      </div>

      {/* Bottom Grid: Fraud by Pattern (4 cols) | ML Model Health (4 cols) | Recent Blocks/Flags (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fraud by Pattern (4 cols) */}
        <div className="lg:col-span-4 bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Fraud by Pattern
          </h3>

          <div className="space-y-4">
            {data && data.risk_by_pattern && data.risk_by_pattern.map((pat) => (
              <div key={pat.pattern_name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 truncate mr-2">{pat.pattern_name}</span>
                  <span className="font-bold text-slate-100">{pat.volume_formatted}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-[#0B0E14] rounded-full overflow-hidden border border-[#1F293D]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pat.percentage}%`,
                      backgroundColor: pat.color_hex,
                      boxShadow: `0 0 8px ${pat.color_hex}80`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ML Model Health / Risk Engine Metrics (4 cols) */}
        <div className="lg:col-span-4 bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              ML Model Health
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
              All Optimal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {data && data.model_health && data.model_health.map((stat) => (
              <div
                key={stat.metric}
                className="bg-[#0B0E14] border border-[#1F293D] rounded-xl p-3.5 space-y-1 text-center"
              >
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-slate-300 font-mono">
                  {stat.metric}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Flags / Blocks list (4 cols) */}
        <div className="lg:col-span-4 bg-[#121721] border border-[#1F293D] rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Recent Flagged
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Latest Signals</span>
          </div>

          <div className="space-y-2.5">
            {data && data.recent_flagged && data.recent_flagged.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectTransaction(item.id)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0E14] border border-[#1F293D] hover:border-rose-500/40 hover:bg-[#18202F] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                  <div>
                    <div className="font-mono font-bold text-xs text-slate-200 group-hover:text-rose-300 transition-colors">
                      {item.reference_id}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.customer_name} • {item.ip_country}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-slate-100">
                    ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-mono text-rose-400">
                    Score {item.risk_score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
