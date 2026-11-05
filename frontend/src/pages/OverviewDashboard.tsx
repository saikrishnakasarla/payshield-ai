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
  Globe2, 
  Cpu, 
  AlertTriangle, 
  Layers, 
  CreditCard,
  PlusCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { RiskBadge } from '../components/RiskBadge';
import { DashboardSummary } from '../lib/types';
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

  const hasTimelineData = data?.timeline && data.timeline.length > 0;
  const hasOrigins = data?.high_risk_origins && data.high_risk_origins.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Header
        title="Fraud Analytics"
        subtitle="Real-time detection metrics & risk telemetry"
        selectedTimeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Demo notice banner */}
      <DemoNoticeBadge />

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards Row */}
      {data && data.metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard data={data.metrics.risk_volume} />
          <StatCard data={data.metrics.flagged_today} />
          <StatCard data={data.metrics.deterministic_accuracy} />
          <StatCard data={data.metrics.avg_latency} />
          <StatCard data={data.metrics.under_review} />
        </div>
      )}

      {/* Middle Grid: Detection Timeline & High-Risk Origins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Detection Timeline Chart */}
        <section 
          className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
          aria-labelledby="detection-timeline-heading"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 id="detection-timeline-heading" className="text-sm font-bold text-slate-900 font-sans">
                Detection Timeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">High vs Medium risk transactions over time</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" aria-hidden="true" />
                <span className="text-slate-700 font-medium">High Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" aria-hidden="true" />
                <span className="text-slate-700 font-medium">Medium Risk</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {hasTimelineData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis 
                    dataKey="timestamp_label" 
                    stroke="#64748B" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2E8F0' }} 
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2E8F0' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#CBD5E1', 
                      borderRadius: '12px',
                      color: '#0F172A',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="high_risk"
                    name="High Risk"
                    stroke="#E11D48"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHigh)"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium_risk"
                    name="Medium Risk"
                    stroke="#D97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Activity className="w-8 h-8 text-slate-400 mb-2" aria-hidden="true" />
                <p className="text-xs font-semibold text-slate-700">No telemetry recorded for this timeframe</p>
                <p className="text-[11px] text-slate-500 mt-1">Execute a test transaction in the PayPal Sandbox to view live timeline metrics.</p>
                <Link
                  to="/sandbox"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-sm hover:bg-blue-700 focus-ring"
                >
                  <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Test in Sandbox</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* High-Risk Origins */}
        <section 
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
          aria-labelledby="high-risk-origins-heading"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="high-risk-origins-heading" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
              High-Risk Origins
            </h2>
            <span className="text-[11px] font-mono font-medium text-slate-500">IP Mismatch</span>
          </div>

          <div className="space-y-3.5">
            {hasOrigins ? (
              data.high_risk_origins.map((origin) => (
                <div key={origin.country_code} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-5 bg-slate-100 rounded font-mono text-[11px] font-bold text-slate-700 flex items-center justify-center border border-slate-200 shadow-sm">
                      {origin.country_code}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{origin.country}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{origin.attempts} attempts</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-600 text-sm">
                      {origin.flag_rate}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <p>No high-risk geographic flags detected.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            Flags correlate with IP vs. billing country mismatch heuristics.
          </div>
        </section>

      </div>

      {/* Bottom Grid: Fraud by Pattern | ML Model Health | Recent Flagged */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fraud by Pattern */}
        <section 
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm"
          aria-labelledby="fraud-patterns-heading"
        >
          <h2 id="fraud-patterns-heading" className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" aria-hidden="true" />
            Fraud by Pattern
          </h2>

          <div className="space-y-4">
            {data && data.risk_by_pattern && data.risk_by_pattern.map((pat) => (
              <div key={pat.pattern_name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-700 font-medium truncate mr-2">{pat.pattern_name}</span>
                  <span className="font-bold text-slate-900">{pat.volume_formatted}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pat.percentage}%`,
                      backgroundColor: pat.color_hex,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ML Model Health */}
        <section 
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm"
          aria-labelledby="ml-model-health-heading"
        >
          <div className="flex items-center justify-between">
            <h2 id="ml-model-health-heading" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              ML Model Health
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-semibold">
              All Optimal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {data && data.model_health && data.model_health.map((stat) => (
              <div
                key={stat.metric}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-center"
              >
                <div className="text-xl font-bold font-mono text-slate-900">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-slate-700 font-sans">
                  {stat.metric}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Flags */}
        <section 
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm"
          aria-labelledby="recent-flagged-heading"
        >
          <div className="flex items-center justify-between">
            <h2 id="recent-flagged-heading" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" aria-hidden="true" />
              Recent Flagged
            </h2>
            <Link to="/transactions" className="text-[11px] font-mono text-blue-600 hover:text-blue-800 font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {data && data.recent_flagged && data.recent_flagged.length > 0 ? (
              data.recent_flagged.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectTransaction(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTransaction(item.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect flagged transaction ${item.reference_id}, amount $${item.amount}, score ${item.risk_score}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group focus-ring"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.reference_id}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.customer_name} • {item.ip_country}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-slate-900">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-rose-600">
                      Score {item.risk_score}/100
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No flagged transactions at this time.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
