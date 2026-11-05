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
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { RiskBadge } from '../components/RiskBadge';
import { DashboardSummary } from '../lib/types';
import { fetchDashboardSummary, resetDemoDatabase } from '../lib/api';
import { CanvasWrapper } from '../components/3d/CanvasWrapper';
import { SecurityShield3D } from '../components/3d/SecurityShield3D';
import { DigitalGlobe3D } from '../components/3d/DigitalGlobe3D';

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
        title="AI Security Operations Center"
        subtitle="Real-time merchant risk intelligence, ML fraud telemetry & PayPal verification"
        selectedTimeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* 3D SOC Hero Banner */}
      <div className="w-full rounded-3xl bg-gradient-to-r from-soc-card/95 via-soc-secondary/85 to-soc-card/95 border border-soc-cyan/30 p-5 sm:p-7 relative overflow-hidden shadow-[0_0_35px_rgba(0,229,255,0.1)] backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-soc-cyan/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-soc-teal/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Text & Mission Control */}
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soc-cyan/15 border border-soc-cyan/40 text-soc-cyan text-xs font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(0,229,255,0.2)]">
              <ShieldCheck className="w-4 h-4 text-soc-cyan animate-pulse" />
              <span>PAYSHIELD DEFENSE ACTIVE // REAL-TIME PROTECTION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans leading-tight">
              Continuous Risk Screening & <span className="text-transparent bg-clip-text bg-gradient-to-r from-soc-cyan to-soc-teal">Explainable AI</span>
            </h2>
            <p className="text-xs sm:text-sm text-soc-textMuted max-w-2xl leading-relaxed">
              Every payment is analyzed against 14 mathematical heuristic rules, an XGBoost risk ensemble, and grounded Gemini 1.5 Flash explanations with zero merchant-side false declines.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/sandbox"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-cyan-gradient text-soc-bg text-xs font-bold shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all focus-ring"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate PayPal Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/transactions"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-soc-card hover:bg-soc-elevated text-soc-cyan text-xs font-semibold border border-soc-cyan/30 shadow-sm transition-all focus-ring"
              >
                <Activity className="w-4 h-4" />
                <span>Live Transaction Stream</span>
              </Link>
            </div>
          </div>

          {/* Right Compact 3D Shield & Globe Visual */}
          <div className="lg:col-span-4 h-52 sm:h-56 w-full relative flex items-center justify-center">
            <div className="w-full h-full relative">
              <CanvasWrapper className="w-full h-full" camera={{ position: [0, 0, 4.2], fov: 42 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[3, 4, 3]} intensity={1.5} color="#00e5ff" />
                <directionalLight position={[-3, -2, -2]} intensity={0.7} color="#00f5c8" />
                <DigitalGlobe3D radius={1.5} position={[0, -0.2, -1.8]} interactive={false} />
                <SecurityShield3D position={[0, 0.05, 0]} scale={0.9} interactive={true} />
              </CanvasWrapper>
            </div>
          </div>
        </div>
      </div>

      {/* Demo notice banner */}
      <DemoNoticeBadge />

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-soc-card border border-soc-cyan/20 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
              <div className="h-4 w-24 bg-soc-secondary rounded" />
              <div className="h-8 w-20 bg-soc-secondary rounded" />
              <div className="h-3 w-16 bg-soc-secondary/60 rounded" />
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
          className="lg:col-span-8 bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 shadow-[0_0_25px_rgba(0,0,0,0.5)] flex flex-col justify-between backdrop-blur-md"
          aria-labelledby="detection-timeline-heading"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 id="detection-timeline-heading" className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Activity className="w-4 h-4 text-soc-cyan" />
                Detection Timeline
              </h2>
              <p className="text-xs text-soc-textMuted mt-0.5">High vs Medium risk transactions over time</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-soc-danger shadow-[0_0_8px_#ff5263]" aria-hidden="true" />
                <span className="text-soc-text font-medium">High Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-soc-warning shadow-[0_0_8px_#ffb547]" aria-hidden="true" />
                <span className="text-soc-text font-medium">Medium Risk</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {hasTimelineData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5263" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FF5263" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB547" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FFB547" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#102538" vertical={false} />
                  <XAxis 
                    dataKey="timestamp_label" 
                    stroke="#A6B6C7" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#102538' }} 
                  />
                  <YAxis 
                    stroke="#A6B6C7" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#102538' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#071522', 
                      borderColor: '#00E5FF', 
                      borderRadius: '12px',
                      color: '#FFFFFF', 
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="high_risk"
                    name="High Risk"
                    stroke="#FF5263"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHigh)"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium_risk"
                    name="Medium Risk"
                    stroke="#FFB547"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-soc-secondary/50 border border-dashed border-soc-cyan/30 rounded-xl">
                <Activity className="w-8 h-8 text-soc-cyan/60 mb-2 animate-pulse" aria-hidden="true" />
                <p className="text-xs font-semibold text-white">No telemetry recorded for this timeframe</p>
                <p className="text-[11px] text-soc-textMuted mt-1">Execute a test transaction in the PayPal Sandbox to view live timeline metrics.</p>
                <Link
                  to="/sandbox"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-cyan-gradient text-soc-bg text-xs font-bold shadow-sm focus-ring"
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
          className="lg:col-span-4 bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 shadow-[0_0_25px_rgba(0,0,0,0.5)] flex flex-col justify-between backdrop-blur-md"
          aria-labelledby="high-risk-origins-heading"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="high-risk-origins-heading" className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-soc-cyan" aria-hidden="true" />
              High-Risk Origins
            </h2>
            <span className="text-[11px] font-mono font-medium text-soc-textMuted">IP Mismatch</span>
          </div>

          <div className="space-y-3.5">
            {hasOrigins ? (
              data.high_risk_origins.map((origin) => (
                <div key={origin.country_code} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-6 bg-soc-secondary rounded font-mono text-[11px] font-bold text-soc-cyan flex items-center justify-center border border-soc-cyan/30 shadow-[0_0_8px_rgba(0,229,255,0.15)]">
                      {origin.country_code}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{origin.country}</div>
                      <div className="text-[11px] text-soc-textMuted font-mono">{origin.attempts} attempts</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-soc-danger text-sm drop-shadow-[0_0_8px_rgba(255,82,99,0.3)]">
                      {origin.flag_rate}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-soc-textMuted text-xs">
                <p>No high-risk geographic flags detected.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-soc-cyan/15 text-[11px] text-soc-textMuted">
            Flags correlate with IP vs. billing country mismatch heuristics.
          </div>
        </section>

      </div>

      {/* Bottom Grid: Fraud by Pattern | ML Model Health | Recent Flagged */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fraud by Pattern */}
        <section 
          className="lg:col-span-4 bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md"
          aria-labelledby="fraud-patterns-heading"
        >
          <h2 id="fraud-patterns-heading" className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-soc-cyan" aria-hidden="true" />
            Fraud by Pattern
          </h2>

          <div className="space-y-4">
            {data && data.risk_by_pattern && data.risk_by_pattern.map((pat) => (
              <div key={pat.pattern_name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-soc-text font-medium truncate mr-2">{pat.pattern_name}</span>
                  <span className="font-bold text-soc-cyan">{pat.volume_formatted}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-soc-secondary rounded-full overflow-hidden border border-soc-cyan/20">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_currentColor]"
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
          className="lg:col-span-4 bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md"
          aria-labelledby="ml-model-health-heading"
        >
          <div className="flex items-center justify-between">
            <h2 id="ml-model-health-heading" className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-soc-teal" aria-hidden="true" />
              ML Model Health
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-soc-teal/15 text-soc-teal border border-soc-teal/30 text-[11px] font-mono font-semibold shadow-[0_0_10px_rgba(0,245,200,0.2)]">
              All Optimal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {data && data.model_health && data.model_health.map((stat) => (
              <div
                key={stat.metric}
                className="bg-soc-secondary/80 border border-soc-cyan/20 rounded-xl p-3.5 space-y-1 text-center hover:border-soc-cyan/40 transition-colors"
              >
                <div className="text-xl font-bold font-mono text-white">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-soc-cyan font-sans">
                  {stat.metric}
                </div>
                <div className="text-[11px] text-soc-textMuted leading-tight">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Flags */}
        <section 
          className="lg:col-span-4 bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md"
          aria-labelledby="recent-flagged-heading"
        >
          <div className="flex items-center justify-between">
            <h2 id="recent-flagged-heading" className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-soc-danger" aria-hidden="true" />
              Recent Flagged
            </h2>
            <Link to="/transactions" className="text-[11px] font-mono text-soc-cyan hover:text-soc-teal font-medium">
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
                  className="flex items-center justify-between p-3 rounded-xl bg-soc-secondary/80 border border-soc-cyan/20 hover:border-soc-cyan/60 hover:bg-soc-elevated transition-all cursor-pointer group focus-ring shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-soc-danger shadow-[0_0_6px_#ff5263]" aria-hidden="true" />
                    <div>
                      <div className="font-mono font-bold text-xs text-white group-hover:text-soc-cyan transition-colors">
                        {item.reference_id}
                      </div>
                      <div className="text-[11px] text-soc-textMuted font-mono">
                        {item.customer_name} • {item.ip_country}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-white">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-soc-danger">
                      Score {item.risk_score}/100
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-soc-textMuted text-xs">
                No flagged transactions at this time.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
