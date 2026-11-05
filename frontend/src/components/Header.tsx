import React from 'react';
import { DemoNoticeBadge } from './DemoNoticeBadge';
import { RefreshCw, Play, LogIn, LogOut } from 'lucide-react';
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
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
      <div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">{title}</h1>
          <DemoNoticeBadge compact />
        </div>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
        {/* Merchant Session Status */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-500" aria-hidden="true" />
            <span className="text-slate-900 font-bold truncate max-w-[140px]">{user.business_name || user.full_name}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-slate-400 hover:text-rose-600 transition-colors ml-1 p-0.5 focus-ring rounded"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Link
            to="/signin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-sm transition-all focus-ring"
          >
            <LogIn className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            <span>Merchant Sign In</span>
          </Link>
        )}

        {/* System Active Badge */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
          role="status"
          aria-label="System Protection Active"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>Protection Active</span>
        </div>

        {/* Timeframe selector pills */}
        {onTimeframeChange && (
          <div 
            className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200"
            role="group"
            aria-label="Select timeframe"
          >
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => onTimeframeChange(tf.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all focus-ring ${
                  selectedTimeframe === tf.id
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
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
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all focus-ring"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-sm transition-all disabled:opacity-50 focus-ring"
            title="Re-seed synthetic transactions with deterministic risk scores"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-600' : 'text-slate-500'}`} aria-hidden="true" />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
