import React from 'react';
import { DemoNoticeBadge } from './DemoNoticeBadge';
import { RefreshCw, Play, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

interface HeaderProps {
  title: string;
  subtitle: string;
  selectedTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  selectedTimeframe = '24h',
  onTimeframeChange,
  onResetDemo,
  isResetting = false,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const timeframes = [
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
  ];

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-soc-cyan/20 mb-6">
      <div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">{title}</h1>
          <DemoNoticeBadge compact />
        </div>
        <p className="text-xs text-soc-textMuted mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
        {/* Merchant Session Status */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-soc-card border border-soc-cyan/30 shadow-[0_0_12px_rgba(0,229,255,0.1)] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-soc-teal shadow-[0_0_6px_#00f5c8]" aria-hidden="true" />
            <span className="text-white font-bold truncate max-w-[140px]">{user.business_name || user.full_name}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-soc-textMuted hover:text-soc-danger transition-colors ml-1 p-0.5 focus-ring rounded cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Link
            to="/signin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-soc-card hover:bg-soc-card/80 text-soc-text text-xs font-medium border border-soc-cyan/30 shadow-sm transition-all focus-ring"
          >
            <LogIn className="w-3.5 h-3.5 text-soc-cyan" aria-hidden="true" />
            <span>Merchant Sign In</span>
          </Link>
        )}

        {/* System Active Badge */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-soc-teal/15 border border-soc-teal/30 text-soc-teal text-xs font-medium shadow-[0_0_10px_rgba(0,245,200,0.15)]"
          role="status"
          aria-label="System Protection Active"
        >
          <span className="w-2 h-2 rounded-full bg-soc-teal animate-pulse" aria-hidden="true" />
          <span>SOC Shield Active</span>
        </div>

        {/* Timeframe selector pills */}
        {onTimeframeChange && (
          <div 
            className="flex items-center bg-soc-card p-1 rounded-xl border border-soc-cyan/20"
            role="group"
            aria-label="Select timeframe"
          >
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => onTimeframeChange(tf.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all focus-ring cursor-pointer ${
                  selectedTimeframe === tf.id
                    ? 'bg-soc-cyan text-soc-bg shadow-[0_0_10px_rgba(0,229,255,0.4)] font-bold'
                    : 'text-soc-textMuted hover:text-white'
                }`}
                aria-pressed={selectedTimeframe === tf.id}
              >
                {tf.label}
              </button>
            ))}
          </div>
        )}

        {/* Action: Test PayPal Sandbox */}
        <Link
          to="/sandbox"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-cyan-gradient text-soc-bg text-xs font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all focus-ring"
        >
          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>Test Sandbox</span>
        </Link>

        {/* Action: Reset Demo Data */}
        {onResetDemo && (
          <button
            type="button"
            onClick={onResetDemo}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-soc-card hover:bg-soc-elevated text-soc-text text-xs font-medium border border-soc-cyan/20 shadow-sm transition-all disabled:opacity-50 focus-ring cursor-pointer"
            title="Re-seed synthetic transactions with deterministic risk scores"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-soc-cyan' : 'text-soc-textMuted'}`} aria-hidden="true" />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
