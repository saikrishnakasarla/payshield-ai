import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, ShieldAlert, LogIn, User as UserIcon } from 'lucide-react';
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
    <header className="lg:hidden sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#1F293D] px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Left: Hamburger Button + Logo */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenNav}
          className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#18202F] active:bg-[#18202F] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <NavLink to="/" className="flex items-center gap-2" title="PayShield AI Home">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-slate-100 font-sans block leading-none">
              PayShield AI
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
        </NavLink>
      </div>

      {/* Right: Quick Auth Action */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <NavLink
            to="/settings"
            className="flex items-center gap-1.5 p-1 rounded-full text-slate-300 hover:text-white transition-all min-h-[44px] min-w-[44px] justify-center"
            title={`${user.full_name} (${user.email})`}
          >
            <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              {userInitials}
            </div>
          </NavLink>
        ) : (
          <NavLink
            to="/signin"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium transition-all min-h-[38px]"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sign In</span>
          </NavLink>
        )}
      </div>
    </header>
  );
};
