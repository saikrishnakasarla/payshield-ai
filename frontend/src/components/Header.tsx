import React from 'react';
import { DemoNoticeBadge } from './DemoNoticeBadge';
import { RefreshCw, Play, LogIn, LogOut, User as UserIcon } from 'lucide-react';
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
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1F293D] mb-6">
      <div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
          <DemoNoticeBadge compact />
        </div>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Merchant Session Status */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121721] border border-cyan-500/30 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
            <span className="text-slate-200 font-bold truncate max-w-[120px]">{user.business_name || user.full_name}</span>
            <button
              onClick={() => logout()}
              className="text-slate-400 hover:text-rose-400 transition-colors ml-1 p-0.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/signin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-all"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Merchant Sign In</span>
          </Link>
        )}

        {/* System Active Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
          <span>Protection Active</span>
        </div>

        {/* Timeframe selector pills */}
        {onTimeframeChange && (
          <div className="flex items-center bg-[#121721] p-1 rounded-xl border border-[#1F293D]">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => onTimeframeChange(tf.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  selectedTimeframe === tf.id
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        )}

        {/* Action: Test PayPal Sandbox */}
        <Link
          to="/sandbox"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-all shadow-[0_0_12px_rgba(14,165,233,0.2)]"
        >
          <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
          <span>Test Sandbox</span>
        </Link>

        {/* Action: Reset Demo Data */}
        {onResetDemo && (
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121721] hover:bg-[#18202F] text-slate-300 text-xs font-medium border border-[#1F293D] transition-all disabled:opacity-50"
            title="Re-seed synthetic transactions with deterministic risk scores (requires auth)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
