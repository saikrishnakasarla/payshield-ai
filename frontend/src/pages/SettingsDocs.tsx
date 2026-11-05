import React, { useEffect, useState } from 'react';
import { 
  SlidersHorizontal, 
  ShieldAlert, 
  Key, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  BookOpen, 
  ExternalLink,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { fetchSettings, updateThresholds, resetDemoDatabase } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export const SettingsDocs: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<any | null>(null);
  const [baselineMultiplier, setBaselineMultiplier] = useState<number>(3.0);
  const [velocityWindow, setVelocityWindow] = useState<number>(10);
  const [mediumRiskScore, setMediumRiskScore] = useState<number>(35);
  const [highRiskScore, setHighRiskScore] = useState<number>(70);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const loadSettings = async () => {
    try {
      const res = await fetchSettings();
      setSettings(res);
      if (res.thresholds) {
        setBaselineMultiplier(res.thresholds.baseline_multiplier);
        setVelocityWindow(res.thresholds.velocity_window_minutes);
        setMediumRiskScore(res.thresholds.medium_risk_score);
        setHighRiskScore(res.thresholds.high_risk_score);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!isAuthenticated) {
      setErrorMessage('Updating risk thresholds requires an authenticated merchant account. Please sign in.');
      return;
    }

    setIsSaving(true);
    try {
      await updateThresholds({
        baseline_multiplier: Number(baselineMultiplier),
        velocity_window_minutes: Number(velocityWindow),
        medium_risk_score: Number(mediumRiskScore),
        high_risk_score: Number(highRiskScore),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save thresholds.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = async () => {
    setErrorMessage(null);
    if (!isAuthenticated) {
      setErrorMessage('Resetting the demo database requires an authenticated merchant account. Please sign in.');
      return;
    }

    if (!window.confirm('Reset all transaction records back to the reproducible synthetic 32 scenarios?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetDemoDatabase();
      alert('Demo data successfully re-seeded!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset failed.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <Header
        title="Settings & Rule Configuration"
        subtitle="Configure risk thresholds, inspect sandbox readiness & view integration documentation"
      />

      <DemoNoticeBadge />

      {errorMessage && (
        <div className="p-4 rounded-xl bg-soc-danger/15 border border-soc-danger/40 text-soc-danger text-xs flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(255,82,99,0.15)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-soc-danger flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {!isAuthenticated && (
            <Link
              to="/signin"
              className="px-3 py-1 rounded-lg bg-soc-danger hover:bg-soc-danger/90 text-white text-xs font-semibold transition-colors focus-ring"
            >
              Sign In
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configurable Thresholds & Connection Status (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Risk Engine Thresholds Form */}
          <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-soc-cyan/20">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-soc-cyan" />
                <h3 className="font-bold text-sm text-white">Deterministic Risk Thresholds</h3>
              </div>
              <span className="text-xs font-semibold text-soc-cyan">Live Configuration</span>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-soc-text font-semibold block mb-1">
                    Baseline Amount Multiplier
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1.5"
                      max="10.0"
                      value={baselineMultiplier}
                      onChange={(e) => setBaselineMultiplier(parseFloat(e.target.value))}
                      className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3.5 py-2 text-white font-mono focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-soc-textMuted text-[11px] font-mono">x baseline</span>
                  </div>
                  <span className="text-[10px] text-soc-textMuted mt-1 block">Default: 3.0x (+35 pts)</span>
                </div>

                <div>
                  <label className="text-soc-text font-semibold block mb-1">
                    Velocity Window (Minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={velocityWindow}
                      onChange={(e) => setVelocityWindow(parseInt(e.target.value) || 10)}
                      className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3.5 py-2 text-white font-mono focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-soc-textMuted text-[11px] font-mono">mins</span>
                  </div>
                  <span className="text-[10px] text-soc-textMuted mt-1 block">Window for ≥3 attempts (+25 pts)</span>
                </div>

                <div>
                  <label className="text-soc-text font-semibold block mb-1">
                    Medium Risk Floor Score
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={mediumRiskScore}
                    onChange={(e) => setMediumRiskScore(parseInt(e.target.value) || 35)}
                    className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3.5 py-2 text-white font-mono focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20"
                  />
                  <span className="text-[10px] text-soc-textMuted mt-1 block">Scores ≥ this trigger Medium Risk</span>
                </div>

                <div>
                  <label className="text-soc-text font-semibold block mb-1">
                    High Risk Floor Score
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="90"
                    value={highRiskScore}
                    onChange={(e) => setHighRiskScore(parseInt(e.target.value) || 70)}
                    className="w-full bg-soc-secondary/80 border border-soc-cyan/25 rounded-xl px-3.5 py-2 text-white font-mono focus:bg-soc-secondary focus:outline-none focus:border-soc-cyan focus:ring-2 focus:ring-soc-cyan/20"
                  />
                  <span className="text-[10px] text-soc-textMuted mt-1 block">Scores ≥ this trigger High Risk</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-soc-textMuted">
                  Settings take effect immediately on subsequent transactions.
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl btn-cyan-gradient text-soc-bg font-bold transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] disabled:opacity-50 focus-ring cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Updating...' : 'Save Thresholds'}</span>
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-soc-teal/15 border border-soc-teal/30 text-soc-teal text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-soc-teal" />
                  <span>Thresholds updated in active runtime memory successfully.</span>
                </div>
              )}
            </form>
          </div>

          {/* Integration & Credentials Inspection */}
          <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 space-y-4 text-xs shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-soc-cyan/20">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-soc-cyan" />
                <h3 className="font-bold text-sm text-white">Service Integrations</h3>
              </div>
              <span className="text-xs font-semibold text-soc-textMuted">Backend Secrets Secured</span>
            </div>

            <div className="space-y-3">
              {/* PayPal Sandbox Status */}
              <div className="p-3.5 rounded-xl bg-soc-secondary/80 border border-soc-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-white">PayPal Orders v2 API</div>
                  <div className="text-xs text-soc-textMuted mt-0.5 font-mono">
                    Target: {settings?.paypal?.api_endpoint || 'https://api-m.sandbox.paypal.com'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    settings?.paypal?.is_configured
                      ? 'bg-soc-teal/15 text-soc-teal border-soc-teal/30'
                      : 'bg-soc-warning/15 text-soc-warning border-soc-warning/30'
                  }`}>
                    {settings?.paypal?.is_configured ? 'SANDBOX KEYS VERIFIED' : 'OFFLINE SIMULATOR'}
                  </span>
                </div>
              </div>

              {/* Gemini AI Status */}
              <div className="p-3.5 rounded-xl bg-soc-secondary/80 border border-soc-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-white">Google Gemini Explainer</div>
                  <div className="text-xs text-soc-textMuted mt-0.5 font-mono">
                    Model: {settings?.ai?.model || 'gemini-1.5-flash'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    settings?.ai?.is_configured
                      ? 'bg-soc-teal/15 text-soc-teal border-soc-teal/30'
                      : 'bg-soc-cyan/15 text-soc-cyan border-soc-cyan/30'
                  }`}>
                    {settings?.ai?.is_configured ? 'GEMINI LIVE' : 'DETERMINISTIC FALLBACK'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Architectural Principles & Reset (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Hackathon Principles Card */}
          <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <div className="flex items-center gap-2 pb-3 border-b border-soc-cyan/20">
              <BookOpen className="w-5 h-5 text-soc-cyan" />
              <h3 className="font-bold text-sm text-white">Ethical AI & Compliance</h3>
            </div>

            <div className="space-y-3 text-xs text-soc-textMuted leading-relaxed font-sans">
              <p>
                <strong className="text-white">1. Probabilistic Review Only:</strong> PayShield AI never asserts 100% certainty or accuses buyers of criminality. All risk tiers represent recommendation indicators for merchant review.
              </p>
              <p>
                <strong className="text-white">2. Deterministic Scoring Grounding:</strong> Numeric risk scores (0–100) are generated purely by transparent rules. Gemini AI is used exclusively to explain evidence in plain English, never hallucinating new facts.
              </p>
              <p>
                <strong className="text-white">3. Non-Destructive Actions:</strong> The assistant does not block real consumer cards or deny customers automatically, protecting merchants from false-positive churn.
              </p>
            </div>
          </div>

          {/* Database Demo Re-Seed */}
          <div className="bg-soc-card/90 border border-soc-cyan/25 rounded-2xl p-5 sm:p-6 space-y-3 text-xs shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-soc-textMuted" />
              <h4 className="font-bold text-white">Re-Seed Synthetic Database</h4>
            </div>
            <p className="text-xs text-soc-textMuted">
              Restores the database to 32 pristine synthetic demo transactions with pre-calculated baseline patterns for clean repeatable testing.
            </p>
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="w-full py-2.5 rounded-xl bg-soc-secondary hover:bg-soc-elevated text-soc-text hover:text-white border border-soc-cyan/20 text-xs font-semibold transition-all disabled:opacity-50 focus-ring cursor-pointer"
            >
              {isResetting ? 'Re-seeding SQLite Database...' : 'Reset to Clean 32 Seed Transactions'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
