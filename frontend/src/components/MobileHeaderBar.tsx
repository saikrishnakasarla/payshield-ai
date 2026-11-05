import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface MobileHeaderBarProps {
  onOpenNav: () => void;
}

export const MobileHeaderBar: React.FC<MobileHeaderBarProps> = ({ onOpenNav }) => {
  const { user, isAuthenticated } = useAuth();

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PS';

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-[#0F172A] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-sm">
      {/* Left: Hamburger Button + Logo */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenNav}
          className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <NavLink to="/" className="flex items-center gap-2.5 focus-ring rounded-lg" title="PayShield AI Home">
          <div className="p-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white font-sans block leading-none">
              PayShield AI
            </span>
            <span className="text-[10px] font-mono text-teal-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
              Active Protection
            </span>
          </div>
        </NavLink>
      </div>

      {/* Right: Quick Auth Action */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <NavLink
            to="/settings"
            className="flex items-center gap-1.5 p-1 rounded-full text-slate-300 hover:text-white transition-all min-h-[44px] min-w-[44px] justify-center focus-ring"
            title={`${user.full_name} (${user.email})`}
            aria-label={`Profile: ${user.full_name}`}
          >
            <div className="w-8 h-8 rounded-full border border-teal-500/40 bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              {userInitials}
            </div>
          </NavLink>
        ) : (
          <NavLink
            to="/signin"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all min-h-[38px] shadow-sm focus-ring"
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign In</span>
          </NavLink>
        )}
      </div>
    </header>
  );
};
